import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * AuthService — Keycloak Admin API interactions
 *
 * Uses Keycloak Admin REST API to trigger password reset emails.
 * Always returns success to avoid leaking whether an email exists.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly keycloakUrl: string;
  private readonly realm: string;
  private readonly adminClientId: string;
  private readonly adminClientSecret: string;

  constructor(private readonly config: ConfigService) {
    this.keycloakUrl = config.getOrThrow<string>('KEYCLOAK_URL');
    this.realm = config.getOrThrow<string>('KEYCLOAK_REALM');
    this.adminClientId = config.get<string>('KEYCLOAK_ADMIN_CLIENT_ID') ?? 'psyscale-admin';
    this.adminClientSecret = config.get<string>('KEYCLOAK_ADMIN_SECRET') ?? '';
  }

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
        this.logger.warn(`Keycloak user search failed: ${usersRes.status}`);
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
        this.logger.warn(`Keycloak execute-actions-email failed: ${actionRes.status}`);
      }
    } catch (err) {
      this.logger.error(`Password reset request error: ${(err as Error).message}`);
    }
  }

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
        this.logger.warn(`Keycloak admin token fetch failed: ${res.status}`);
        return null;
      }

      const data = (await res.json()) as { access_token: string };
      return data.access_token;
    } catch (err) {
      this.logger.error(`Admin token error: ${(err as Error).message}`);
      return null;
    }
  }
}
