import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UserRole } from '@psyscale/shared-types';
import { refreshPortalAccessToken, PORTAL_ACCESS_TTL_SEC } from '../auth.config';
import type { JWT } from 'next-auth/jwt';

// Audit #10 — les tokens portail (patient/tuteur) doivent être rafraîchis.
// Ce helper appelle l'API NestJS /auth/refresh selon le rôle et renouvelle
// accessToken + expiresAt, ou force la reconnexion en cas d'échec.

const FETCH = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', FETCH);
  FETCH.mockReset();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

function patientToken(): JWT {
  return { role: UserRole.PATIENT, accessToken: 'old-at', refreshToken: 'rt', patientId: 'pat1', expiresAt: 1 } as JWT;
}

describe('refreshPortalAccessToken', () => {
  it('appelle l\'endpoint patient et renouvelle accessToken + expiresAt', async () => {
    FETCH.mockResolvedValue({ ok: true, json: async () => ({ accessToken: 'new-at', refreshToken: 'new-rt', patientId: 'pat1' }) });

    const result = await refreshPortalAccessToken(patientToken());

    const url = FETCH.mock.calls[0][0] as string;
    expect(url).toContain('/patient-portal/auth/refresh');
    expect(result.accessToken).toBe('new-at');
    expect(result.refreshToken).toBe('new-rt');
    expect(result.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000) + PORTAL_ACCESS_TTL_SEC - 5);
  });

  it('route vers l\'endpoint guardian pour un tuteur', async () => {
    FETCH.mockResolvedValue({ ok: true, json: async () => ({ accessToken: 'new-at' }) });

    await refreshPortalAccessToken({ role: UserRole.GUARDIAN, refreshToken: 'rt', accessToken: 'old' } as JWT);

    expect(FETCH.mock.calls[0][0]).toContain('/guardian-portal/auth/refresh');
  });

  it('conserve le refreshToken précédent si l\'API n\'en renvoie pas', async () => {
    FETCH.mockResolvedValue({ ok: true, json: async () => ({ accessToken: 'new-at' }) });

    const result = await refreshPortalAccessToken(patientToken());
    expect(result.refreshToken).toBe('rt');
  });

  it('vide l\'accessToken (force reconnexion) si le refresh échoue (HTTP non-ok)', async () => {
    FETCH.mockResolvedValue({ ok: false, json: async () => ({}) });

    const result = await refreshPortalAccessToken(patientToken());
    expect(result.accessToken).toBe('');
    expect(result.refreshToken).toBeUndefined();
  });

  it('vide l\'accessToken sur erreur réseau', async () => {
    FETCH.mockRejectedValue(new Error('network down'));

    const result = await refreshPortalAccessToken(patientToken());
    expect(result.accessToken).toBe('');
  });

  it('ne tente rien sans refreshToken', async () => {
    const result = await refreshPortalAccessToken({ role: UserRole.PATIENT, accessToken: 'x' } as JWT);
    expect(FETCH).not.toHaveBeenCalled();
    expect(result.accessToken).toBe('');
  });
});
