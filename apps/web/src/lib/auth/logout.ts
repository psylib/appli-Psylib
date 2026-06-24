import { signOut } from 'next-auth/react';

/**
 * Déconnexion sûre : révoque le token côté API (blacklist JTI) AVANT de
 * détruire la session NextAuth. À utiliser sur TOUS les points de
 * déconnexion psy/assistant — sinon un token reste exploitable côté API
 * après un logout (gap de sécurité sur données de santé).
 *
 * La révocation est best-effort : on déconnecte quoi qu'il arrive.
 */
export async function revokeAndSignOut(
  accessToken?: string,
  callbackUrl = '/login',
): Promise<void> {
  if (accessToken) {
    try {
      const apiBase = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';
      await fetch(`${apiBase}/api/v1/auth/revoke`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch {
      // silencieux — on déconnecte quoi qu'il arrive
    }
  }
  void signOut({ callbackUrl });
}
