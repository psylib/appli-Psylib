import { vi, describe, it, expect, beforeEach } from 'vitest';
import { KeycloakJwtStrategy } from './keycloak-jwt.strategy';
import type { JwtPayload } from '@psyscale/shared-types';

function createConfig() {
  const values: Record<string, string> = {
    KEYCLOAK_URL: 'https://auth.test',
    KEYCLOAK_REALM: 'psyscale',
  };
  return {
    getOrThrow: vi.fn((key: string) => values[key]),
    get: vi.fn((key: string) => values[key]),
  } as unknown as import('@nestjs/config').ConfigService;
}

function createPrisma() {
  return {
    psychologist: {
      findUnique: vi.fn().mockResolvedValue({ id: 'psy-1', userId: 'psy-1' }),
      create: vi.fn().mockResolvedValue({}),
    },
    user: {
      upsert: vi.fn().mockResolvedValue({}),
    },
    assistant: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
  };
}

function createCache() {
  return {
    get: vi.fn().mockResolvedValue(null),
  } as unknown as import('../common/cache.service').CacheService;
}

function makePayload(overrides: Partial<JwtPayload> = {}): JwtPayload {
  return {
    sub: 'user-1',
    email: 'user@test.fr',
    realm_access: { roles: ['psychologist'] },
    ...overrides,
  } as JwtPayload;
}

describe('KeycloakJwtStrategy', () => {
  let prisma: ReturnType<typeof createPrisma>;
  let strategy: KeycloakJwtStrategy;

  beforeEach(() => {
    prisma = createPrisma();
    strategy = new KeycloakJwtStrategy(
      createConfig(),
      prisma as unknown as import('../common/prisma.service').PrismaService,
      createCache(),
    );
  });

  it('sets psychologistUserId = sub for a psychologist token', async () => {
    const result = await strategy.validate(
      makePayload({ sub: 'psy-1', realm_access: { roles: ['psychologist'] } }),
    );
    expect(result.role).toBe('psychologist');
    expect(result.psychologistUserId).toBe('psy-1');
  });

  it('sets psychologistUserId = sub for an admin token', async () => {
    const result = await strategy.validate(
      makePayload({ sub: 'admin-1', realm_access: { roles: ['admin'] } }),
    );
    expect(result.role).toBe('admin');
    expect(result.psychologistUserId).toBe('admin-1');
  });

  it('resolves psychologistUserId for an assistant token', async () => {
    prisma.assistant.findFirst.mockResolvedValue({
      psychologist: { userId: 'psy-user-1' },
    });
    const result = await strategy.validate(
      makePayload({ sub: 'assistant-user-1', realm_access: { roles: ['assistant'] } }),
    );
    expect(result.role).toBe('assistant');
    expect(result.psychologistUserId).toBe('psy-user-1');
    // an assistant must NOT trigger psychologist provisioning
    expect(prisma.psychologist.create).not.toHaveBeenCalled();
    expect(prisma.assistant.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'assistant-user-1', status: 'active' } }),
    );
  });

  it('throws Unauthorized for a revoked/unlinked assistant', async () => {
    prisma.assistant.findFirst.mockResolvedValue(null);
    await expect(
      strategy.validate(makePayload({ sub: 'x', realm_access: { roles: ['assistant'] } })),
    ).rejects.toThrow();
  });
});
