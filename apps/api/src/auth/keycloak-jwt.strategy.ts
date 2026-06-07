import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import type { JwtPayload } from '@psyscale/shared-types';
import { PrismaService } from '../common/prisma.service';
import { CacheService } from '../common/cache.service';

export interface KeycloakUser {
  sub: string;
  email: string;
  role: string;
  roles: string[];
  name?: string;
  /**
   * Keycloak user id of the *tenant* psychologist:
   * - psychologist/admin: their own `sub`
   * - assistant: the userId of the psychologist they are attached to
   * Use for tenant-scoping queries. Keep `sub` as the audit actorId.
   */
  psychologistUserId: string;
}

/**
 * KeycloakJwtStrategy — Valide les JWT Keycloak via JWKS endpoint
 *
 * NestJS récupère automatiquement la clé publique Keycloak (JWKS)
 * et vérifie la signature du JWT à chaque requête.
 * Pas de stockage de clé — rotation automatique via JWKS.
 *
 * Auto-provisioning : crée User + Psychologist en base au premier login
 * pour les comptes créés directement dans Keycloak.
 */
@Injectable()
export class KeycloakJwtStrategy extends PassportStrategy(Strategy, 'keycloak-jwt') {
  private readonly logger = new Logger(KeycloakJwtStrategy.name);
  /**
   * OIDC clients (azp / authorized party) allowed to call this API. A signed
   * realm token alone is not enough — it must have been issued to one of our
   * own clients. Configurable via KEYCLOAK_ALLOWED_AZP (comma-separated);
   * set to empty to disable the check (kill-switch for incident rollback).
   */
  private readonly allowedAzp: Set<string>;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {
    const keycloakUrl = configService.getOrThrow<string>('KEYCLOAK_URL');
    const realm = configService.getOrThrow<string>('KEYCLOAK_REALM');
    const jwksUri = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/certs`;

    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      issuer: `${keycloakUrl}/realms/${realm}`,
      algorithms: ['RS256'],
    });

    const allowed = (
      configService.get<string>('KEYCLOAK_ALLOWED_AZP') ?? 'psyscale-app,psylib-mobile'
    )
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    this.allowedAzp = new Set(allowed);

    this.logger.log(`Keycloak JWKS endpoint: ${jwksUri}`);
    this.logger.log(
      this.allowedAzp.size > 0
        ? `Keycloak azp allow-list: ${[...this.allowedAzp].join(', ')}`
        : 'Keycloak azp check DISABLED (KEYCLOAK_ALLOWED_AZP empty)',
    );
  }

  async validate(payload: JwtPayload): Promise<KeycloakUser> {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Token invalide — sub ou email manquant');
    }

    // Audience check: reject tokens minted for a client other than ours. The
    // signature/issuer guarantee the realm, but not *which* client requested the
    // token — without this any realm client could impersonate the app.
    if (this.allowedAzp.size > 0) {
      const azp = payload.azp;
      if (azp && !this.allowedAzp.has(azp)) {
        throw new UnauthorizedException('Token émis pour un client non autorisé');
      }
    }

    // Vérification blacklist : token révoqué au logout ?
    if (payload.jti) {
      const revoked = await this.cache.get<string>(`revoked:${payload.jti}`);
      if (revoked) {
        throw new UnauthorizedException('Token révoqué');
      }
    }

    // Extraction du rôle depuis realm_access
    const realmRoles = payload.realm_access?.roles ?? [];
    const role = this.extractPrimaryRole(realmRoles);

    // Auto-provisioning : crée User + Psychologist si absent (premier login Keycloak)
    // Jamais pour un assistant — un assistant n'est pas un psychologue.
    if (role === 'psychologist' || role === 'admin') {
      await this.provisionUser(payload.sub, payload.email, role);
    }

    // Résolution du tenant : pour un assistant, le tenant est le psychologue rattaché.
    // Sinon, l'utilisateur est son propre tenant.
    let psychologistUserId = payload.sub;
    if (role === 'assistant') {
      const link = await this.prisma.assistant.findFirst({
        where: { userId: payload.sub, status: 'active' },
        include: { psychologist: { select: { userId: true } } },
      });
      if (!link) {
        throw new UnauthorizedException('Compte assistant non rattaché ou révoqué');
      }
      psychologistUserId = link.psychologist.userId;
    }

    return {
      sub: payload.sub,
      email: payload.email,
      role,
      roles: realmRoles,
      name: (payload as JwtPayload & { name?: string }).name,
      psychologistUserId,
    };
  }

  private async provisionUser(sub: string, email: string, role: string): Promise<void> {
    try {
      const existing = await this.prisma.psychologist.findUnique({ where: { userId: sub } });
      if (existing) return; // Déjà provisionné

      // Créer le User avec l'UUID Keycloak comme id
      await this.prisma.user.upsert({
        where: { id: sub },
        create: { id: sub, email, role: role === 'admin' ? 'admin' : 'psychologist' },
        update: {},
      });

      // Créer le Psychologist
      const baseName = email.split('@')[0] ?? 'praticien';
      const slug = baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + randomBytes(4).toString('hex');
      await this.prisma.psychologist.create({
        data: { userId: sub, name: baseName, slug, isOnboarded: false },
      });

      this.logger.log(`Profil auto-provisionné pour ${email}`);
    } catch (err) {
      // Ne pas bloquer la connexion si le provisioning échoue
      this.logger.error(`Erreur provisioning ${email}: ${(err as Error).message}`);
    }
  }

  private extractPrimaryRole(roles: string[]): string {
    // Priorité : admin > psychologist > assistant > patient
    if (roles.includes('admin')) return 'admin';
    if (roles.includes('psychologist')) return 'psychologist';
    if (roles.includes('assistant')) return 'assistant';
    if (roles.includes('patient')) return 'patient';
    return 'patient';
  }
}
