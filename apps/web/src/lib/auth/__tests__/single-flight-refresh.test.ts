import { describe, it, expect } from 'vitest';
import { singleFlightRefresh } from '../auth.config';
import type { JWT } from 'next-auth/jwt';

// Incident 2026-06-29 — la rotation Keycloak (Revoke Refresh Token + Max Reuse 0)
// faisait échouer les refresh concurrents de next-auth → accessToken vidé →
// déconnexions intempestives. `singleFlightRefresh` mutualise les refresh qui
// partagent la même clé (même refresh token) : un seul appel réseau, un seul
// résultat partagé. Ceinture+bretelles côté code, indépendant du réglage Keycloak.

describe('singleFlightRefresh', () => {
  it('mutualise les appels concurrents partageant la même clé (run appelé une seule fois)', async () => {
    let calls = 0;
    let resolveFn!: (v: JWT) => void;
    const run = () => {
      calls++;
      return new Promise<JWT>((r) => {
        resolveFn = r;
      });
    };

    const p1 = singleFlightRefresh('shared-key', run);
    const p2 = singleFlightRefresh('shared-key', run);

    expect(calls).toBe(1);
    expect(p1).toBe(p2);

    resolveFn({ accessToken: 'a' } as JWT);
    expect(await p1).toEqual({ accessToken: 'a' });
    expect(await p2).toEqual({ accessToken: 'a' });
  });

  it('clés différentes → appels séparés', async () => {
    let calls = 0;
    const run = () => {
      calls++;
      return Promise.resolve({ accessToken: 'x' } as JWT);
    };

    await Promise.all([
      singleFlightRefresh('key-a', run),
      singleFlightRefresh('key-b', run),
    ]);

    expect(calls).toBe(2);
  });

  it('libère la clé après résolution (un appel ultérieur relance run)', async () => {
    let calls = 0;
    const run = () => {
      calls++;
      return Promise.resolve({ accessToken: 'x' } as JWT);
    };

    await singleFlightRefresh('seq-key', run);
    await singleFlightRefresh('seq-key', run);

    expect(calls).toBe(2);
  });

  it('libère la clé même si run rejette', async () => {
    let calls = 0;
    const run = () => {
      calls++;
      return Promise.reject(new Error('boom'));
    };

    await expect(singleFlightRefresh('err-key', run)).rejects.toThrow('boom');

    const run2 = () => {
      calls++;
      return Promise.resolve({ accessToken: 'ok' } as JWT);
    };
    const result = await singleFlightRefresh('err-key', run2);

    expect(calls).toBe(2);
    expect(result.accessToken).toBe('ok');
  });
});
