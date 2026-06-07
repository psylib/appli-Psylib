import { vi, describe, it, expect } from 'vitest';
import { CalendarSyncService } from './calendar-sync.service';

// Tests sécu du module Google Calendar Sync (audit #10 — module sans tests) :
//  - state OAuth = JWT signé (anti-CSRF) vérifié à la volée
//  - tokens OAuth (access + refresh) chiffrés AES-256-GCM avant persistance
//  - refresh automatique re-chiffre le nouveau token
//  - audit CALENDAR_CONNECT / CALENDAR_DISCONNECT

function buildService(overrides: Record<string, any> = {}) {
  const prisma: any = {
    calendarConnection: {
      upsert: vi.fn().mockResolvedValue({}),
      findUnique: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue({}),
    },
    psychologist: { findUnique: vi.fn().mockResolvedValue({ userId: 'psyUser' }) },
    appointment: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
    ...overrides.prisma,
  };
  const encryption = {
    encrypt: vi.fn().mockImplementation((v: string) => `ENC(${v})`),
    decrypt: vi.fn().mockImplementation((v: string) => v.replace(/^ENC\(/, '').replace(/\)$/, '')),
  };
  const audit = { log: vi.fn().mockResolvedValue(undefined) };
  const notifications = { createAndDispatch: vi.fn().mockResolvedValue(undefined) };
  const config = { get: vi.fn().mockImplementation((k: string) => (k === 'OAUTH_STATE_SECRET' ? 'state-secret' : undefined)) };
  const googleProvider = {
    getAuthUrl: vi.fn().mockImplementation((state: string) => `https://accounts.google.com/o/oauth2?state=${state}`),
    exchangeCode: vi.fn().mockResolvedValue({ accessToken: 'AT', refreshToken: 'RT', expiresAt: new Date(Date.now() + 3600_000), email: 'psy@gmail.com' }),
    refreshAccessToken: vi.fn().mockResolvedValue({ accessToken: 'AT2', expiresAt: new Date(Date.now() + 3600_000) }),
    revokeToken: vi.fn().mockResolvedValue(undefined),
    stopWatch: vi.fn().mockResolvedValue(undefined),
  };
  const syncQueue = { add: vi.fn().mockResolvedValue(undefined) };

  const service = new CalendarSyncService(
    prisma as any, encryption as any, audit as any, notifications as any,
    config as any, googleProvider as any, syncQueue as any,
  );
  return { service, prisma, encryption, audit, googleProvider, syncQueue };
}

describe('CalendarSyncService — OAuth state (anti-CSRF)', () => {
  it('signe puis vérifie le state JWT (roundtrip)', () => {
    const { service } = buildService();
    const url = service.getAuthUrl('psy1');
    const state = decodeURIComponent(url.split('state=')[1]);

    expect(service.verifyState(state)).toEqual({ psychologistId: 'psy1' });
  });

  it('rejette un state forgé/invalide', () => {
    const { service } = buildService();
    expect(() => service.verifyState('not-a-valid-jwt')).toThrow();
  });
});

describe('CalendarSyncService.handleCallback', () => {
  it('chiffre access ET refresh token avant persistance (jamais en clair)', async () => {
    const { service, prisma, encryption } = buildService();

    await service.handleCallback('psy1', 'auth-code');

    expect(encryption.encrypt).toHaveBeenCalledWith('AT');
    expect(encryption.encrypt).toHaveBeenCalledWith('RT');
    const args = prisma.calendarConnection.upsert.mock.calls[0][0];
    expect(args.create.accessToken).toBe('ENC(AT)');
    expect(args.create.refreshToken).toBe('ENC(RT)');
    // jamais le token en clair
    expect(JSON.stringify(args)).not.toContain('"accessToken":"AT"');
  });

  it('émet un audit CALENDAR_CONNECT et enfile une sync initiale', async () => {
    const { service, audit, syncQueue } = buildService();

    await service.handleCallback('psy1', 'auth-code');

    expect(audit.log.mock.calls.some((c: any[]) => c[0]?.action === 'CALENDAR_CONNECT')).toBe(true);
    expect(syncQueue.add).toHaveBeenCalledWith('initial-sync', { psychologistId: 'psy1' }, expect.anything());
  });
});

describe('CalendarSyncService.getValidAccessToken', () => {
  function conn(expiresInMs: number) {
    return { id: 'c1', accessToken: 'ENC(AT)', refreshToken: 'ENC(RT)', tokenExpiresAt: new Date(Date.now() + expiresInMs) } as any;
  }

  it('renvoie le token déchiffré sans refresh si non expiré', async () => {
    const { service, googleProvider } = buildService();

    const token = await service.getValidAccessToken(conn(60 * 60 * 1000));

    expect(token).toBe('AT');
    expect(googleProvider.refreshAccessToken).not.toHaveBeenCalled();
  });

  it('rafraîchit et re-chiffre le nouveau token si expiré', async () => {
    const { service, prisma, encryption, googleProvider } = buildService();

    const token = await service.getValidAccessToken(conn(60 * 1000)); // < buffer 5 min → expiré

    expect(googleProvider.refreshAccessToken).toHaveBeenCalledWith('RT');
    expect(encryption.encrypt).toHaveBeenCalledWith('AT2');
    expect(prisma.calendarConnection.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ accessToken: 'ENC(AT2)' }) }),
    );
    expect(token).toBe('AT2');
  });
});

describe('CalendarSyncService.disconnect', () => {
  it('révoque, purge googleEventId, supprime la connexion et audite', async () => {
    const { service, prisma, audit, googleProvider } = buildService();
    prisma.calendarConnection.findUnique.mockResolvedValue({
      psychologistId: 'psy1', accessToken: 'ENC(AT)', watchChannelId: null, watchResourceId: null,
    });

    await service.disconnect('psy1', 'psyUser');

    expect(googleProvider.revokeToken).toHaveBeenCalledWith('AT');
    expect(prisma.appointment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { psychologistId: 'psy1' }, data: { googleEventId: null } }),
    );
    expect(prisma.calendarConnection.delete).toHaveBeenCalled();
    expect(audit.log.mock.calls.some((c: any[]) => c[0]?.action === 'CALENDAR_DISCONNECT')).toBe(true);
  });

  it('ne fait rien si aucune connexion', async () => {
    const { service, prisma } = buildService();
    prisma.calendarConnection.findUnique.mockResolvedValue(null);

    await service.disconnect('psy1', 'psyUser');
    expect(prisma.calendarConnection.delete).not.toHaveBeenCalled();
  });
});
