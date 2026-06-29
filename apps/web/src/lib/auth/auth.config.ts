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
            refreshToken?: string;
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
            refreshToken: data.refreshToken,
          };
        } catch {
          return null;
        }
      },
    }),

    // Auth guardian — email/password via notre API NestJS
    CredentialsProvider({
      id: 'guardian-credentials',
      name: 'Guardian',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const apiUrl = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';
          const res = await fetch(`${apiUrl}/api/v1/guardian-portal/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: credentials.email, password: credentials.password }),
          });
          if (!res.ok) return null;
          const data = (await res.json()) as { accessToken: string; refreshToken?: string; userId: string; email: string };
          return { id: data.userId, email: data.email, role: UserRole.GUARDIAN, accessToken: data.accessToken, refreshToken: data.refreshToken };
        } catch { return null; }
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

      // Patient credentials login — access token HS256 de 1h + refresh token 7j
      if (account?.provider === 'patient-credentials' && user) {
        const patientUser = user as typeof user & { patientId: string; accessToken: string; refreshToken?: string; role: UserRole };
        token.role = UserRole.PATIENT;
        token.patientId = patientUser.patientId;
        token.accessToken = patientUser.accessToken;
        token.refreshToken = patientUser.refreshToken;
        token.expiresAt = Math.floor(Date.now() / 1000) + PORTAL_ACCESS_TTL_SEC;
        return token;
      }

      // Guardian credentials login
      if (account?.provider === 'guardian-credentials' && user) {
        const guardianUser = user as typeof user & { accessToken: string; refreshToken?: string; role: UserRole };
        token.role = UserRole.GUARDIAN;
        token.accessToken = guardianUser.accessToken;
        token.refreshToken = guardianUser.refreshToken;
        token.expiresAt = Math.floor(Date.now() / 1000) + PORTAL_ACCESS_TTL_SEC;
        return token;
      }

      // Token encore valide (ou expire dans > 60s) — rien à faire
      const nowSec = Math.floor(Date.now() / 1000);
      if (token.expiresAt && nowSec < token.expiresAt - 60) {
        return token;
      }

      if (!token.refreshToken) return token; // Pas de refresh token disponible

      // Refresh mutualisé (single-flight) : plusieurs requêtes concurrentes
      // arrivées près de l'expiration ne déclenchent qu'UN seul refresh. Sans ça,
      // avec la rotation Keycloak (Revoke Refresh Token), le 1er refresh invalide
      // le token et les suivants échouent → accessToken vidé → déconnexion
      // intempestive (incident 2026-06-29).
      // Tokens portail (patient/tuteur) via l'API NestJS (HS256, pas Keycloak)
      if (token.role === UserRole.PATIENT || token.role === UserRole.GUARDIAN) {
        return singleFlightRefresh(`portal:${token.refreshToken}`, () =>
          refreshPortalAccessToken(token),
        );
      }

      // Refresh Keycloak token (psy/admin/assistant)
      return singleFlightRefresh(`kc:${token.refreshToken}`, () =>
        refreshKeycloakToken(token),
      );
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
  if (roles.includes('assistant')) return UserRole.ASSISTANT;
  if (roles.includes('guardian')) return UserRole.GUARDIAN;
  return UserRole.PATIENT;
}

/** Durée de vie de l'access token portail (HS256) — aligné sur l'API NestJS (1h). */
export const PORTAL_ACCESS_TTL_SEC = 60 * 60;

/**
 * Dédoublonnage des refresh concurrents (single-flight).
 *
 * next-auth (JWT stateless) peut exécuter le callback `jwt` en parallèle pour
 * plusieurs requêtes simultanées arrivées juste après l'expiration de l'access
 * token. Sans single-flight, chacune lance son propre refresh ; avec la rotation
 * Keycloak (Revoke Refresh Token activé), le 1er refresh invalide l'ancien token
 * et les suivants reçoivent un 400 → `accessToken` vidé → déconnexion
 * intempestive de tous les psys (incident 2026-06-29).
 *
 * On mutualise ici les refresh partageant la même clé (= même refresh token) :
 * une seule requête réseau, le même résultat partagé par tous les appelants.
 * La clé est libérée dès que le refresh est terminé (succès OU échec).
 *
 * NB : la map est par instance de fonction. Sur plusieurs instances concurrentes
 * (Vercel), la course résiduelle reste couverte par Keycloak « Refresh Token
 * Max Reuse » ≥ 1. Les deux protections sont complémentaires.
 */
const inflightRefreshes = new Map<string, Promise<JWT>>();
export function singleFlightRefresh(
  key: string,
  run: () => Promise<JWT>,
): Promise<JWT> {
  const existing = inflightRefreshes.get(key);
  if (existing) return existing;

  const pending = run().finally(() => {
    inflightRefreshes.delete(key);
  });
  inflightRefreshes.set(key, pending);
  return pending;
}

/**
 * Rafraîchit un access token Keycloak (psy/admin/assistant) via l'endpoint
 * token OIDC. Renvoie un token avec `accessToken` vidé (force la reconnexion)
 * si le refresh échoue (HTTP non-ok ou erreur réseau).
 */
export async function refreshKeycloakToken(token: JWT): Promise<JWT> {
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
          refresh_token: token.refreshToken ?? '',
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

    return {
      ...token,
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
      expiresAt: Math.floor(Date.now() / 1000) + (refreshed.expires_in ?? 900),
    };
  } catch {
    // Erreur réseau — forcer reconnexion pour éviter une UI semi-fonctionnelle
    return { ...token, accessToken: '', refreshToken: undefined };
  }
}

/**
 * Rafraîchit un access token portail (patient/tuteur) via l'API NestJS.
 * Renvoie un token avec accessToken vidé (force la reconnexion) si le refresh échoue.
 */
export async function refreshPortalAccessToken(token: JWT): Promise<JWT> {
  if (!token.refreshToken) {
    return { ...token, accessToken: '', refreshToken: undefined };
  }
  const apiUrl = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';
  const segment = token.role === UserRole.GUARDIAN ? 'guardian-portal' : 'patient-portal';
  try {
    const res = await fetch(`${apiUrl}/api/v1/${segment}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: token.refreshToken }),
    });
    if (!res.ok) {
      return { ...token, accessToken: '', refreshToken: undefined };
    }
    const data = (await res.json()) as {
      accessToken: string;
      refreshToken?: string;
      patientId?: string;
    };
    return {
      ...token,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken ?? token.refreshToken,
      patientId: data.patientId ?? token.patientId,
      expiresAt: Math.floor(Date.now() / 1000) + PORTAL_ACCESS_TTL_SEC,
    };
  } catch {
    // Erreur réseau — forcer la reconnexion pour éviter une UI semi-fonctionnelle
    return { ...token, accessToken: '', refreshToken: undefined };
  }
}
