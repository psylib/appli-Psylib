import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NotificationGateway } from '../notification.gateway';

// Mock jwks-rsa and jsonwebtoken to avoid real crypto
vi.mock('jwks-rsa', () => ({
  default: vi.fn(() => ({
    getSigningKey: vi.fn(),
  })),
}));

vi.mock('jsonwebtoken', () => ({
  decode: vi.fn(),
  verify: vi.fn(),
}));

describe('NotificationGateway', () => {
  let gateway: NotificationGateway;

  beforeEach(() => {
    const mockConfigService = {
      get: vi.fn((key: string, defaultValue?: string) => {
        if (key === 'KEYCLOAK_URL') return 'https://auth.test.local';
        if (key === 'KEYCLOAK_REALM') return 'test-realm';
        return defaultValue;
      }),
    };

    gateway = new NotificationGateway(mockConfigService as any);
    gateway.onModuleInit();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  it('sendToUser emits notification event to user room', () => {
    const mockEmit = vi.fn();
    const mockServer = { to: vi.fn().mockReturnValue({ emit: mockEmit }) };
    (gateway as any).server = mockServer;

    const notification = {
      id: '1',
      type: 'test',
      title: 'Test',
      body: 'Body',
      readAt: null,
      createdAt: new Date().toISOString(),
    };
    gateway.sendToUser('user-123', notification);

    expect(mockServer.to).toHaveBeenCalledWith('user:user-123');
    expect(mockEmit).toHaveBeenCalledWith('notification', notification);
  });

  it('sendToUser does nothing when server is not initialized', () => {
    (gateway as any).server = undefined;
    // Should not throw
    gateway.sendToUser('user-123', { id: '1' });
  });

  it('isUserOnline returns false when no server', () => {
    (gateway as any).server = undefined;
    expect(gateway.isUserOnline('user-123')).toBe(false);
  });

  it('isUserOnline returns false when user has no active connections', () => {
    const mockServer = {
      sockets: { adapter: { rooms: new Map() } },
    };
    (gateway as any).server = mockServer;
    expect(gateway.isUserOnline('user-123')).toBe(false);
  });

  it('isUserOnline returns true when user has active connections', () => {
    const rooms = new Map();
    rooms.set('user:user-123', new Set(['socket-1']));
    const mockServer = { sockets: { adapter: { rooms } } };
    (gateway as any).server = mockServer;

    expect(gateway.isUserOnline('user-123')).toBe(true);
  });
});
