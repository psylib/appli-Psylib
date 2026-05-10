import {
  Injectable,
  Logger,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma.service';
import { EmailService } from '../notifications/email.service';

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
  ) {
    this.keycloakUrl = config.getOrThrow<string>('KEYCLOAK_URL');
    this.realm = config.getOrThrow<string>('KEYCLOAK_REALM');
    this.adminClientId =
      config.get<string>('KEYCLOAK_ADMIN_CLIENT_ID') ?? 'psyscale-admin';
    this.adminClientSecret =
      config.get<string>('KEYCLOAK_ADMIN_SECRET') ?? '';
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
    await this.createDbRecords(userId, email, firstName, lastName, adeliOrRpps);

    // 4. Send password setup email via Keycloak SMTP
    await this.sendPasswordSetupEmail(adminToken, userId);

    // 5. Notify admin
    this.notifyAdmin(firstName, lastName, email, adeliOrRpps).catch(() => {});

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
      const body = await res.text().catch(() => '');
      this.logger.error(
        `Keycloak user creation failed: ${res.status} — ${body}`,
      );
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
      const body = await res.text().catch(() => '');
      this.logger.warn(
        `Keycloak password setup email failed: ${res.status} — ${body}`,
      );
    }
  }

  private async createDbRecords(
    userId: string,
    email: string,
    firstName: string,
    lastName: string,
    adeliOrRpps: string,
  ): Promise<void> {
    const fullName = `${firstName} ${lastName}`;
    const slug =
      `${firstName}-${lastName}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') +
      '-' +
      Math.random().toString(36).slice(2, 7);

    try {
      await this.prisma.user.create({
        data: { id: userId, email: email.toLowerCase(), role: 'psychologist' },
      });

      await this.prisma.psychologist.create({
        data: {
          userId,
          name: fullName,
          slug,
          adeliNumber: adeliOrRpps.replace(/\s/g, ''),
          isOnboarded: false,
        },
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
  ): Promise<void> {
    const date = new Date().toLocaleString('fr-FR', {
      timeZone: 'Europe/Paris',
    });

    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    await this.emailService.sendRawEmail(
      this.adminEmail,
      `Nouvelle inscription PsyLib — ${firstName} ${lastName}`,
      `<div style="font-family:Inter,Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;">
        <h2 style="color:#3D52A0;margin:0 0 16px;">Nouvelle inscription</h2>
        <table style="width:100%;border-collapse:collapse;font-size:15px;">
          <tr><td style="padding:8px 0;color:#6B7280;">Nom</td><td style="padding:8px 0;font-weight:600;">${esc(firstName)} ${esc(lastName)}</td></tr>
          <tr><td style="padding:8px 0;color:#6B7280;">Email</td><td style="padding:8px 0;">${esc(email)}</td></tr>
          <tr><td style="padding:8px 0;color:#6B7280;">ADELI/RPPS</td><td style="padding:8px 0;font-family:monospace;">${esc(adeliOrRpps)}</td></tr>
          <tr><td style="padding:8px 0;color:#6B7280;">Date</td><td style="padding:8px 0;">${date}</td></tr>
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
