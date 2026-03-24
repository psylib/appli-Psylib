import type { NextAuthConfig } from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { JWT } from 'next-auth/jwt';
import type { Session } from 'next-auth';
import { UserRole } from '@psyscale/shared-types';

declare module 'next-auth' {
  interface Session {
    accessToken: string;
    role: UserRole;
    patientId?: string;
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: UserRole;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number; // timestamp secondes
    role?: UserRole;
    sub?: string;
    patientId?: string;
  }
}

/**
 * Configuration next-auth v5 + Keycloak OIDC
 *
 * Flow : Authorization Code Flow (PKCE)
 * Token : Access Token 15min + Refresh Token 8h
 */
export const authConfig: NextAuthConfig = {
  providers: [
    KeycloakProvider({
      clientId: process.env['KEYCLOAK_CLIENT_ID'] ?? 'psyscale-app',
      clientSecret: process.env['KEYCLOAK_CLIENT_SECRET'] ?? '',
      issuer: `${process.env['KEYCLOAK_URL'] ?? 'https://auth.psylib.eu'}/realms/${process.env['KEYCLOAK_REALM'] ?? 'psyscale'}`,
    }),

    // Auth patient — email/password via notre API NestJS (pas Keycloak)
    CredentialsProvider({
      id: 'patient-credentials',
      name: 'Patient',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const apiUrl = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';
          const res = await fetch(`${apiUrl}/api/v1/patient-portal/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!res.ok) return null;

          const data = (await res.json()) as {
            accessToken: string;
            userId: string;
            patientId: string;
            email: string;
          };

          return {
            id: data.userId,
            email: data.email,
            role: UserRole.PATIENT,
            patientId: data.patientId,
            accessToken: data.accessToken,
          };
        } catch {
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, account, profile, user }) {
      // Keycloak login initial — stocker access + refresh token
      if (account?.access_token) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token ?? undefined;
        token.expiresAt = account.expires_at ?? Math.floor(Date.now() / 1000) + 900; // 15min par défaut

        if (profile) {
          const keycloakProfile = profile as { realm_access?: { roles?: string[] } };
          const realmRoles = keycloakProfile.realm_access?.roles ?? [];
          token.role = extractRole(realmRoles);
        }
        return token;
      }

      // Fallback rôle
      if (!token.role && profile) {
        const keycloakProfile = profile as { realm_access?: { roles?: string[] } };
        const realmRoles = keycloakProfile.realm_access?.roles ?? [];
        token.role = extractRole(realmRoles);
      }

      // Patient credentials login
      if (account?.provider === 'patient-credentials' && user) {
        const patientUser = user as typeof user & { patientId: string; accessToken: string; role: UserRole };
        token.role = UserRole.PATIENT;
        token.patientId = patientUser.patientId;
        token.accessToken = patientUser.accessToken;
        return token;
      }

      // Refresh Keycloak token si expiré (ou expire dans < 60s)
      const nowSec = Math.floor(Date.now() / 1000);
      if (token.expiresAt && nowSec < token.expiresAt - 60) {
        return token; // Encore valide
      }

      if (!token.refreshToken) return token; // Pas de refresh token disponible

      try {
        const keycloakUrl = process.env['KEYCLOAK_URL'] ?? 'https://auth.psylib.eu';
        const realm = process.env['KEYCLOAK_REALM'] ?? 'psyscale';
        const clientId = process.env['KEYCLOAK_CLIENT_ID'] ?? 'psyscale-app';
        const clientSecret = process.env['KEYCLOAK_CLIENT_SECRET'] ?? '';

        const res = await fetch(
          `${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              grant_type: 'refresh_token',
              client_id: clientId,
              client_secret: clientSecret,
              refresh_token: token.refreshToken,
            }),
          },
        );

        if (!res.ok) {
          // Refresh token invalide/expiré → forcer reconnexion
          return { ...token, accessToken: '', refreshToken: undefined };
        }

        const refreshed = (await res.json()) as {
          access_token: string;
          refresh_token?: string;
          expires_in?: number;
        };

        token.accessToken = refreshed.access_token;
        token.refreshToken = refreshed.refresh_token ?? token.refreshToken;
        token.expiresAt = Math.floor(Date.now() / 1000) + (refreshed.expires_in ?? 900);
      } catch {
        // En cas d'erreur réseau, conserver l'ancien token
      }

      return token;
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      session.accessToken = token.accessToken ?? '';
      session.role = token.role ?? UserRole.PATIENT;
      session.patientId = token.patientId;

      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = token.role ?? UserRole.PATIENT;
      }

      return session;
    },

  },

  pages: {
    signIn: '/login',
    error: '/login',
    signOut: '/',
  },

  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60,
  },

  // Requis sur Vercel / mobile — next-auth v5 valide le host par défaut
  trustHost: true,
};

function extractRole(roles: string[]): UserRole {
  if (roles.includes('admin')) return UserRole.ADMIN;
  if (roles.includes('psychologist')) return UserRole.PSYCHOLOGIST;
  return UserRole.PATIENT;
}
