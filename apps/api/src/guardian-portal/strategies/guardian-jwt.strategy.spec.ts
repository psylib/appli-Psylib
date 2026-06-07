import { describe, it, expect, vi } from 'vitest';
import { GuardianJwtStrategy } from './guardian-jwt.strategy';

// Audit #10 — le secret de vérification ne doit PLUS retomber sur PATIENT_JWT_SECRET.
// Le service de signature exige déjà GUARDIAN_JWT_SECRET (getOrThrow), donc la var est
// garantie présente en prod : la stratégie doit l'exiger de la même manière.

function buildConfig(values: Record<string, string | undefined>) {
  return {
    get: (k: string) => values[k],
    getOrThrow: (k: string) => {
      const v = values[k];
      if (v === undefined) throw new Error(`Missing ${k}`);
      return v;
    },
  } as any;
}

describe('GuardianJwtStrategy', () => {
  const prisma = {} as any;

  it('utilise GUARDIAN_JWT_SECRET et ne retombe pas sur PATIENT_JWT_SECRET', () => {
    const config = buildConfig({ GUARDIAN_JWT_SECRET: 'guardian-secret', PATIENT_JWT_SECRET: 'patient-secret' });
    const getOrThrowSpy = vi.spyOn(config, 'getOrThrow');

    expect(() => new GuardianJwtStrategy(config, prisma)).not.toThrow();
    expect(getOrThrowSpy).toHaveBeenCalledWith('GUARDIAN_JWT_SECRET');
  });

  it('lève si GUARDIAN_JWT_SECRET est absent (pas de fallback silencieux)', () => {
    const config = buildConfig({ PATIENT_JWT_SECRET: 'patient-secret' });
    expect(() => new GuardianJwtStrategy(config, prisma)).toThrow(/GUARDIAN_JWT_SECRET/);
  });

  it('rejette un payload dont le rôle n\'est pas guardian', async () => {
    const config = buildConfig({ GUARDIAN_JWT_SECRET: 'guardian-secret' });
    const strategy = new GuardianJwtStrategy(config, prisma);
    await expect(strategy.validate({ sub: 'u1', role: 'patient', email: 'a@b.c' })).rejects.toThrow();
  });
});
