import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { PrismaService } from '../common/prisma.service';
import { CacheService } from '../common/cache.service';
import { RppsVerificationService } from './rpps-verification.service';

/**
 * Pro Santé Connect (e-CPS) — vérification d'identité forte des psychologues.
 *
 * Pro Santé Connect est le fournisseur d'identité OIDC officiel de l'ANS. Le
 * professionnel s'authentifie avec son app e-CPS / sa carte CPS ; PSC renvoie
 * son numéro RPPS lié cryptographiquement à son identité réelle (RNIPP, niveau
 * eIDAS substantiel). Contrairement à la simple vérification d'existence à
 * l'annuaire (numéros publics → usurpables), PSC prouve que la PERSONNE est
 * bien le titulaire du numéro. C'est la voie « reine » (cf. Doctolib).
 *
 * Flux : Authorization Code Flow.
 *   1. /auth/psc/start  → URL d'autorisation (state+nonce liés au psy en cache)
 *   2. PSC authentifie via e-CPS, redirige vers /auth/psc/callback?code&state
 *   3. callback → échange code contre tokens → userinfo → extraction RPPS
 *      (claim SubjectNameID, préfixe « 8 ») → si profession psychologue,
 *      le compte passe `verified` et adopte le RPPS prouvé.
 *
 * ⚠️ Désactivé tant que PSC_ENABLED ≠ 'true' et que client_id/secret ne sont
 *    pas fournis (enregistrement client OIDC à demander à l'ANS).
 */

export interface PscEndpoints {
  authorize: string;
  token: string;
  userinfo: string;
}

// Domaines distincts : l'autorisation est sur `wallet.*`, le reste sur `auth.*`.
const PSC_ENDPOINTS: Record<'sandbox' | 'production', PscEndpoints> = {
  sandbox: {
    authorize: 'https://wallet.bas.psc.esante.gouv.fr/auth',
    token:
      'https://auth.bas.psc.esante.gouv.fr/auth/realms/esante-wallet/protocol/openid-connect/token',
    userinfo:
      'https://auth.bas.psc.esante.gouv.fr/auth/realms/esante-wallet/protocol/openid-connect/userinfo',
  },
  production: {
    authorize: 'https://wallet.esw.esante.gouv.fr/auth',
    token:
      'https://auth.esw.esante.gouv.fr/auth/realms/esante-wallet/protocol/openid-connect/token',
    userinfo:
      'https://auth.esw.esante.gouv.fr/auth/realms/esante-wallet/protocol/openid-connect/userinfo',
  },
};

// Code "Psychologue" dans la nomenclature professions de santé (RPPS).
const PSYCHOLOGUE_PROFESSION_CODE = '93';

interface PscStatePayload {
  psychologistId: string;
  nonce: string;
}

interface PscUserInfo {
  // Identifiant national du PS, préfixé : « 8 » = RPPS. Ne PAS utiliser `sub`.
  SubjectNameID?: string;
  // Rôles/professions : tableau de « code^OID ».
  SubjectRole?: string | string[];
  given_name?: string;
  family_name?: string;
  name?: string;
  [k: string]: unknown;
}

export type PscCallbackOutcome =
  | { status: 'success'; psychologistId: string; rpps: string }
  | { status: 'mismatch'; reason: string }
  | { status: 'not_psychologist' }
  | { status: 'error'; reason: string };

@Injectable()
export class ProSanteConnectService {
  private readonly logger = new Logger(ProSanteConnectService.name);
  private readonly enabled: boolean;
  private readonly env: 'sandbox' | 'production';
  private readonly clientId?: string;
  private readonly clientSecret?: string;
  private readonly redirectUri: string;
  private readonly endpoints: PscEndpoints;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {
    this.enabled = config.get<string>('PSC_ENABLED') === 'true';
    this.env =
      config.get<string>('PSC_ENV') === 'production' ? 'production' : 'sandbox';
    this.clientId = config.get<string>('PSC_CLIENT_ID');
    this.clientSecret = config.get<string>('PSC_CLIENT_SECRET');

    const apiUrl =
      config.get<string>('PUBLIC_API_URL') ??
      config.get<string>('API_URL') ??
      'https://api.psylib.eu';
    this.redirectUri =
      config.get<string>('PSC_REDIRECT_URI') ??
      `${apiUrl}/api/v1/auth/psc/callback`;

    const base = PSC_ENDPOINTS[this.env];
    this.endpoints = {
      authorize: config.get<string>('PSC_AUTHORIZE_URL') ?? base.authorize,
      token: config.get<string>('PSC_TOKEN_URL') ?? base.token,
      userinfo: config.get<string>('PSC_USERINFO_URL') ?? base.userinfo,
    };
  }

  /** true uniquement si la fonctionnalité est activée ET configurée. */
  isConfigured(): boolean {
    return this.enabled && !!this.clientId && !!this.clientSecret;
  }

  private assertConfigured(): void {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        "La vérification Pro Santé Connect n'est pas encore activée.",
      );
    }
  }

  /** Résout le psychologue depuis l'identifiant Keycloak et construit l'URL. */
  async startForUser(keycloakUserId: string): Promise<string> {
    this.assertConfigured();
    const psy = await this.prisma.psychologist.findUnique({
      where: { userId: keycloakUserId },
      select: { id: true },
    });
    if (!psy) throw new NotFoundException('Psychologue introuvable');
    return this.buildAuthorizeUrl(psy.id);
  }

  /**
   * Construit l'URL d'autorisation PSC pour le psychologue connecté.
   * Mémorise state+nonce (liés au psy) en cache 10 min.
   */
  async buildAuthorizeUrl(psychologistId: string): Promise<string> {
    this.assertConfigured();

    const state = randomBytes(24).toString('hex');
    const nonce = randomBytes(24).toString('hex');

    const payload: PscStatePayload = { psychologistId, nonce };
    await this.cache.set(`psc:state:${state}`, payload, 600);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId!,
      redirect_uri: this.redirectUri,
      scope: 'openid scope_all',
      acr_values: 'eidas1',
      state,
      nonce,
    });

    return `${this.endpoints.authorize}?${params.toString()}`;
  }

  /**
   * Traite le retour PSC : valide le state, échange le code, lit le userinfo,
   * extrait le RPPS et passe le compte en `verified` si profession psychologue.
   */
  async handleCallback(
    code: string,
    state: string,
  ): Promise<PscCallbackOutcome> {
    this.assertConfigured();

    if (!code || !state) {
      return { status: 'error', reason: 'Paramètres manquants' };
    }

    const cacheKey = `psc:state:${state}`;
    const payload = await this.cache.get<PscStatePayload>(cacheKey);
    if (!payload) {
      return { status: 'error', reason: 'Session expirée ou state invalide' };
    }
    // State à usage unique.
    void this.cache.del(cacheKey);

    let userinfo: PscUserInfo;
    try {
      const accessToken = await this.exchangeCode(code);
      userinfo = await this.fetchUserInfo(accessToken);
    } catch (err) {
      this.logger.warn(
        `Échange PSC échoué: ${(err as Error).message}`,
      );
      return { status: 'error', reason: 'Échec de la communication avec PSC' };
    }

    const rpps = ProSanteConnectService.extractRpps(userinfo.SubjectNameID);
    if (!rpps) {
      return { status: 'error', reason: 'RPPS introuvable dans la réponse PSC' };
    }

    if (!ProSanteConnectService.isPsychologist(userinfo.SubjectRole)) {
      this.logger.warn(
        `PSC: profil non-psychologue tenté (psy ${payload.psychologistId})`,
      );
      return { status: 'not_psychologist' };
    }

    const psy = await this.prisma.psychologist.findUnique({
      where: { id: payload.psychologistId },
      select: { id: true, adeliNumber: true, verificationStatus: true },
    });
    if (!psy) throw new NotFoundException('Psychologue introuvable');

    const declared = RppsVerificationService.normalize(psy.adeliNumber ?? '');

    // PSC prouve cryptographiquement l'identité ET le RPPS → on fait confiance.
    // Si le numéro déclaré diffère (typiquement ADELI vs RPPS suite migration),
    // on adopte le RPPS prouvé par PSC comme source de vérité.
    await this.prisma.psychologist.update({
      where: { id: psy.id },
      data: {
        verificationStatus: 'verified',
        rppsVerifiedAt: new Date(),
        adeliNumber: rpps,
        verificationNote:
          declared && declared !== rpps
            ? `Vérifié via Pro Santé Connect (RPPS ${rpps} ; numéro initialement déclaré : ${declared})`
            : 'Vérifié via Pro Santé Connect',
      },
    });

    this.logger.log(
      `PSC: psychologue ${psy.id} vérifié (RPPS confirmé par e-CPS)`,
    );

    return { status: 'success', psychologistId: psy.id, rpps };
  }

  // ── Helpers ────────────────────────────────────────────────────────

  private async exchangeCode(code: string): Promise<string> {
    const res = await fetch(this.endpoints.token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
        client_id: this.clientId!,
        client_secret: this.clientSecret!,
      }),
    });
    if (!res.ok) {
      throw new Error(`token endpoint status ${res.status}`);
    }
    const data = (await res.json()) as { access_token?: string };
    if (!data.access_token) throw new Error('access_token manquant');
    return data.access_token;
  }

  private async fetchUserInfo(accessToken: string): Promise<PscUserInfo> {
    const res = await fetch(this.endpoints.userinfo, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      throw new Error(`userinfo endpoint status ${res.status}`);
    }
    // PSC peut renvoyer du JSON ou un JWT signé selon la config client.
    const contentType = res.headers.get('content-type') ?? '';
    if (contentType.includes('application/jwt')) {
      const jwt = await res.text();
      return ProSanteConnectService.decodeJwtPayload(jwt);
    }
    return (await res.json()) as PscUserInfo;
  }

  /** Décode le payload (claims) d'un JWT sans vérif de signature (userinfo TLS). */
  static decodeJwtPayload(jwt: string): PscUserInfo {
    const parts = jwt.split('.');
    if (parts.length !== 3) throw new Error('JWT userinfo invalide');
    const json = Buffer.from(parts[1]!, 'base64url').toString('utf-8');
    return JSON.parse(json) as PscUserInfo;
  }

  /**
   * Extrait le RPPS du claim SubjectNameID. Format : préfixe « 8 » + RPPS
   * (11 chiffres) → on retire le préfixe. Tolère aussi un RPPS nu (11 chiffres).
   */
  static extractRpps(subjectNameId?: string): string | null {
    if (!subjectNameId) return null;
    const digits = subjectNameId.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('8')) {
      return digits.slice(1); // retire le préfixe « 8 »
    }
    if (digits.length === 11) return digits; // RPPS nu
    return null;
  }

  /** Détecte la profession psychologue dans le claim SubjectRole (« code^OID »). */
  static isPsychologist(subjectRole?: string | string[]): boolean {
    if (!subjectRole) return false;
    const roles = Array.isArray(subjectRole) ? subjectRole : [subjectRole];
    return roles.some((r) => {
      const code = String(r).split('^')[0]?.trim();
      return code === PSYCHOLOGUE_PROFESSION_CODE;
    });
  }
}
