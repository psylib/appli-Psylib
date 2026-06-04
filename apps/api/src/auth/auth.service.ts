import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma.service';
import { EmailService } from '../notifications/email.service';
import { RppsVerificationService } from './rpps-verification.service';
import type { RppsVerificationResult } from './rpps-verification.service';
import { SubscriptionPlan, SubscriptionStatus } from '@psyscale/shared-types';
import { StripeService } from '../billing/stripe.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly keycloakUrl: string;
  private readonly realm: string;
  private readonly adminClientId: string;
  private readonly adminClientSecret: string;

  private readonly adminEmail: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly rppsVerification: RppsVerificationService,
    private readonly stripeService: StripeService,
  ) {
    this.keycloakUrl = config.getOrThrow<string>('KEYCLOAK_URL');
    this.realm = config.getOrThrow<string>('KEYCLOAK_REALM');
    this.adminClientId =
      config.get<string>('KEYCLOAK_ADMIN_CLIENT_ID') ?? 'psyscale-admin';
    this.adminClientSecret =
      config.getOrThrow<string>('KEYCLOAK_ADMIN_SECRET');
    this.adminEmail =
      config.get<string>('ADMIN_NOTIFICATION_EMAIL') ?? 'tony@psylib.eu';
  }

  // ── Registration ────────────────────────────────────────────────

  async registerPsychologist(
    email: string,
    firstName: string,
    lastName: string,
    adeliOrRpps: string,
  ): Promise<{ success: boolean; message: string }> {
    // Check if email already exists in DB
    const existingUser = await this.prisma.user.findFirst({
      where: { email: email.toLowerCase() },
    });
    if (existingUser) {
      throw new ConflictException(
        'Un compte avec cette adresse email existe déjà',
      );
    }

    // Vérification du numéro ADELI/RPPS contre l'annuaire officiel des
    // professionnels de santé. Bloque les faux numéros / non-psychologues.
    const rppsResult = await this.rppsVerification.verify(adeliOrRpps);
    if (rppsResult.blocking) {
      this.logger.warn(
        `Inscription refusée (${rppsResult.status}) pour ${email}`,
      );
      throw new BadRequestException(
        rppsResult.message ?? 'Numéro ADELI/RPPS invalide.',
      );
    }

    const adminToken = await this.getAdminToken();
    if (!adminToken) {
      throw new InternalServerErrorException(
        "Service d'authentification indisponible",
      );
    }

    // 1. Create user in Keycloak
    const userId = await this.createKeycloakUser(
      adminToken,
      email,
      firstName,
      lastName,
    );

    // 2. Assign psychologist role
    await this.assignKeycloakRole(adminToken, userId, 'psychologist');

    // 3. Create user + psychologist in DB
    await this.createDbRecords(
      userId,
      email,
      firstName,
      lastName,
      adeliOrRpps,
      rppsResult.status === 'verified',
    );

    // 4. Send password setup email via Keycloak SMTP
    await this.sendPasswordSetupEmail(adminToken, userId);

    // 5. Notify admin
    this.notifyAdmin(firstName, lastName, email, adeliOrRpps, rppsResult).catch(
      (err) =>
        this.logger.warn(
          `Admin notification failed: ${(err as Error).message}`,
        ),
    );

    this.logger.log(`Nouveau psychologue inscrit: ${email}`);

    return {
      success: true,
      message:
        'Compte créé. Vérifiez vos emails pour définir votre mot de passe.',
    };
  }

  private async createKeycloakUser(
    adminToken: string,
    email: string,
    firstName: string,
    lastName: string,
  ): Promise<string> {
    const res = await fetch(
      `${this.keycloakUrl}/admin/realms/${this.realm}/users`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: email.toLowerCase(),
          email: email.toLowerCase(),
          firstName,
          lastName,
          enabled: true,
          emailVerified: false,
          requiredActions: ['UPDATE_PASSWORD'],
        }),
      },
    );

    if (res.status === 409) {
      throw new ConflictException(
        'Un compte avec cette adresse email existe déjà',
      );
    }

    if (!res.ok) {
      // Ne pas logger le body Keycloak — peut contenir email/PII (HDS)
      this.logger.error(`Keycloak user creation failed: ${res.status}`);
      throw new InternalServerErrorException(
        'Erreur lors de la création du compte',
      );
    }

    // Extract user ID from Location header
    const location = res.headers.get('location');
    if (!location) {
      throw new InternalServerErrorException(
        "Impossible de récupérer l'identifiant utilisateur",
      );
    }

    const userId = location.split('/').pop()!;
    this.logger.log(`Keycloak user created: ${userId}`);
    return userId;
  }

  private async assignKeycloakRole(
    adminToken: string,
    userId: string,
    roleName: string,
  ): Promise<void> {
    // Get role details
    const roleRes = await fetch(
      `${this.keycloakUrl}/admin/realms/${this.realm}/roles/${roleName}`,
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );

    if (!roleRes.ok) {
      this.logger.warn(`Keycloak role fetch failed: ${roleRes.status}`);
      return;
    }

    const role = (await roleRes.json()) as { id: string; name: string };

    // Assign role to user
    const assignRes = await fetch(
      `${this.keycloakUrl}/admin/realms/${this.realm}/users/${userId}/role-mappings/realm`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{ id: role.id, name: role.name }]),
      },
    );

    if (!assignRes.ok) {
      this.logger.warn(`Keycloak role assignment failed: ${assignRes.status}`);
    }
  }

  private async sendPasswordSetupEmail(
    adminToken: string,
    userId: string,
  ): Promise<void> {
    const res = await fetch(
      `${this.keycloakUrl}/admin/realms/${this.realm}/users/${userId}/execute-actions-email`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['UPDATE_PASSWORD']),
      },
    );

    if (!res.ok) {
      // Ne pas logger le body Keycloak — peut contenir PII (HDS)
      this.logger.warn(`Keycloak password setup email failed: ${res.status}`);
    }
  }

  private async createDbRecords(
    userId: string,
    email: string,
    firstName: string,
    lastName: string,
    adeliOrRpps: string,
    rppsVerified: boolean,
  ): Promise<void> {
    const fullName = `${firstName} ${lastName}`;
    const slug =
      `${firstName}-${lastName}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') +
      '-' +
      randomBytes(4).toString('hex');

    // Pro trial : 6 months from now
    const trialEndsAt = new Date();
    trialEndsAt.setMonth(trialEndsAt.getMonth() + 6);

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.user.create({
          data: { id: userId, email: email.toLowerCase(), role: 'psychologist' },
        });

        const psy = await tx.psychologist.create({
          data: {
            userId,
            name: fullName,
            slug,
            adeliNumber: adeliOrRpps.replace(/\s/g, ''),
            isOnboarded: false,
            rppsVerifiedAt: rppsVerified ? new Date() : null,
          },
        });

        // Auto-activate 6-month Pro trial for every new registration
        await tx.subscription.create({
          data: {
            psychologistId: psy.id,
            plan: SubscriptionPlan.PRO,
            status: SubscriptionStatus.TRIALING,
            trialEndsAt,
          },
        });
      });
    } catch (err) {
      this.logger.error(
        `DB record creation failed: ${(err as Error).message}`,
      );
      // P2002 = unique constraint (user already exists) → silently continue
      const prismaCode = (err as { code?: string }).code;
      if (prismaCode !== 'P2002') {
        throw err;
      }
    }
  }

  private async notifyAdmin(
    firstName: string,
    lastName: string,
    email: string,
    adeliOrRpps: string,
    rppsResult: RppsVerificationResult,
  ): Promise<void> {
    const date = new Date().toLocaleString('fr-FR', {
      timeZone: 'Europe/Paris',
    });

    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const rppsBadge =
      rppsResult.status === 'verified'
        ? `<span style="color:#0D9488;font-weight:600;">✅ Vérifié à l'annuaire${rppsResult.matchedName ? ` (${esc(rppsResult.matchedName)})` : ''}</span>`
        : `<span style="color:#B45309;font-weight:600;">⚠️ Non vérifié (annuaire indisponible) — à contrôler manuellement</span>`;

    await this.emailService.sendRawEmail(
      this.adminEmail,
      `Nouvelle inscription PsyLib — ${firstName} ${lastName}`,
      `<div style="font-family:Inter,Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;">
        <h2 style="color:#3D52A0;margin:0 0 16px;">Nouvelle inscription</h2>
        <table style="width:100%;border-collapse:collapse;font-size:15px;">
          <tr><td style="padding:8px 0;color:#6B7280;">Nom</td><td style="padding:8px 0;font-weight:600;">${esc(firstName)} ${esc(lastName)}</td></tr>
          <tr><td style="padding:8px 0;color:#6B7280;">Email</td><td style="padding:8px 0;">${esc(email)}</td></tr>
          <tr><td style="padding:8px 0;color:#6B7280;">ADELI/RPPS</td><td style="padding:8px 0;font-family:monospace;">${esc(adeliOrRpps)}</td></tr>
          <tr><td style="padding:8px 0;color:#6B7280;">Annuaire</td><td style="padding:8px 0;">${rppsBadge}</td></tr>
          <tr><td style="padding:8px 0;color:#6B7280;">Date</td><td style="padding:8px 0;">${date}</td></tr>
          <tr><td style="padding:8px 0;color:#6B7280;">Plan activé</td><td style="padding:8px 0;"><strong style="color:#0D9488;">Pro — 6 mois offerts (trial auto)</strong></td></tr>
        </table>
      </div>`,
    );
  }

  // ── Password Reset ──────────────────────────────────────────────

  async requestPasswordReset(email: string): Promise<void> {
    try {
      const adminToken = await this.getAdminToken();
      if (!adminToken) return;

      // Find user by email
      const usersRes = await fetch(
        `${this.keycloakUrl}/admin/realms/${this.realm}/users?email=${encodeURIComponent(email)}&exact=true`,
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      if (!usersRes.ok) {
        this.logger.warn(
          `Keycloak user search failed: ${usersRes.status}`,
        );
        return;
      }

      const users = (await usersRes.json()) as { id: string }[];
      if (users.length === 0) return; // User not found — silent

      const userId = users[0]!.id;

      // Trigger UPDATE_PASSWORD email action
      const actionRes = await fetch(
        `${this.keycloakUrl}/admin/realms/${this.realm}/users/${userId}/execute-actions-email`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(['UPDATE_PASSWORD']),
        },
      );

      if (!actionRes.ok) {
        this.logger.warn(
          `Keycloak execute-actions-email failed: ${actionRes.status}`,
        );
      }
    } catch (err) {
      this.logger.error(
        `Password reset request error: ${(err as Error).message}`,
      );
    }
  }

  // ── Account Deletion ────────────────────────────────────────────

  async deleteAccount(keycloakUserId: string): Promise<void> {
    const psy = await this.prisma.psychologist.findUnique({
      where: { userId: keycloakUserId },
      include: {
        subscription: {
          select: { stripeSubscriptionId: true, plan: true, status: true },
        },
        user: { select: { email: true, createdAt: true } },
        _count: { select: { patients: true } },
      },
    });

    if (!psy) throw new NotFoundException('Compte introuvable');

    // Snapshot for the admin notification (sent after the cascade deletes it all).
    const deletedSnapshot = {
      name: psy.name,
      email: psy.user?.email ?? '—',
      plan: psy.subscription?.plan ?? '—',
      status: psy.subscription?.status ?? '—',
      patientCount: psy._count.patients,
      memberSince: psy.user?.createdAt ?? null,
    };

    // 1. Cancel Stripe subscription immediately (non-blocking on failure)
    const stripeSubId = psy.subscription?.stripeSubscriptionId;
    if (stripeSubId) {
      try {
        await this.stripeService.cancelSubscriptionImmediately(stripeSubId);
      } catch (err) {
        this.logger.warn(`Stripe cancel failed for ${psy.id}: ${(err as Error).message}`);
      }
    }

    // 2. Preserve patient portal accounts — null out the userId link.
    // (Deleting the patient record never deletes the linked User, but we null
    // the link explicitly so no dangling reference remains during the cascade.)
    await this.prisma.patient.updateMany({
      where: { psychologistId: psy.id },
      data: { userId: null },
    });

    // 3. Delete the psychologist FIRST, then the user, in a transaction.
    //    The prod DB FK `psychologists_user_id_fkey` lacks ON DELETE CASCADE
    //    (schema/DB drift), so deleting the user directly is blocked by the
    //    psychologist row. Removing the psychologist first (which cascades to
    //    all its child data) sidesteps that constraint entirely.
    await this.prisma.$transaction([
      this.prisma.psychologist.delete({ where: { id: psy.id } }),
      this.prisma.user.delete({ where: { id: keycloakUserId } }),
    ]);

    // 4. Delete Keycloak user (after DB — prevents re-login attempts during deletion)
    await this.deleteKeycloakUser(keycloakUserId);

    this.logger.log(`Account deleted: psychologistId=${psy.id}`);

    // 5. Notify admin (non-blocking — deletion already succeeded)
    try {
      await this.notifyAccountDeletion(deletedSnapshot);
    } catch (err) {
      this.logger.warn(
        `Account-deletion admin email failed: ${(err as Error).message}`,
      );
    }
  }

  private async notifyAccountDeletion(snapshot: {
    name: string;
    email: string;
    plan: string;
    status: string;
    patientCount: number;
    memberSince: Date | null;
  }): Promise<void> {
    const fmt = (d: Date) =>
      d.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });
    const date = fmt(new Date());
    const esc = (s: string) =>
      s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    await this.emailService.sendRawEmail(
      this.adminEmail,
      `Suppression de compte PsyLib — ${snapshot.name}`,
      `<div style="font-family:Inter,Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;">
        <h2 style="color:#B91C1C;margin:0 0 16px;">Compte supprimé</h2>
        <p style="font-size:15px;color:#374151;margin:0 0 16px;">Un psychologue vient de supprimer son compte.</p>
        <table style="width:100%;border-collapse:collapse;font-size:15px;">
          <tr><td style="padding:8px 0;color:#6B7280;">Nom</td><td style="padding:8px 0;font-weight:600;">${esc(snapshot.name)}</td></tr>
          <tr><td style="padding:8px 0;color:#6B7280;">Email</td><td style="padding:8px 0;">${esc(snapshot.email)}</td></tr>
          <tr><td style="padding:8px 0;color:#6B7280;">Plan</td><td style="padding:8px 0;">${esc(snapshot.plan)} (${esc(snapshot.status)})</td></tr>
          <tr><td style="padding:8px 0;color:#6B7280;">Patients</td><td style="padding:8px 0;">${snapshot.patientCount}</td></tr>
          <tr><td style="padding:8px 0;color:#6B7280;">Inscrit le</td><td style="padding:8px 0;">${snapshot.memberSince ? esc(fmt(snapshot.memberSince)) : '—'}</td></tr>
          <tr><td style="padding:8px 0;color:#6B7280;">Supprimé le</td><td style="padding:8px 0;">${date}</td></tr>
        </table>
      </div>`,
    );
  }

  private async deleteKeycloakUser(keycloakUserId: string): Promise<void> {
    const adminToken = await this.getAdminToken();
    if (!adminToken) {
      this.logger.warn(`Keycloak deletion skipped — no admin token (userId=${keycloakUserId})`);
      return;
    }

    const res = await fetch(
      `${this.keycloakUrl}/admin/realms/${this.realm}/users/${keycloakUserId}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } },
    );

    if (!res.ok && res.status !== 404) {
      this.logger.warn(`Keycloak user deletion failed: ${res.status} (userId=${keycloakUserId})`);
    }
  }

  // ── Admin Token ─────────────────────────────────────────────────

  private async getAdminToken(): Promise<string | null> {
    try {
      const res = await fetch(
        `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: this.adminClientId,
            client_secret: this.adminClientSecret,
          }),
        },
      );

      if (!res.ok) {
        this.logger.warn(
          `Keycloak admin token fetch failed: ${res.status}`,
        );
        return null;
      }

      const data = (await res.json()) as { access_token: string };
      return data.access_token;
    } catch (err) {
      this.logger.error(
        `Admin token error: ${(err as Error).message}`,
      );
      return null;
    }
  }
}
