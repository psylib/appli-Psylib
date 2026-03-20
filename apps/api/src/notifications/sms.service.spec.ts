import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SmsService } from './sms.service';

// ─── Mock OVH SDK ────────────────────────────────────────────────────────────

const mockRequestPromised = vi.fn().mockResolvedValue({ ids: [123] });

vi.mock('ovh', () => {
  const factory = vi.fn().mockImplementation(() => ({
    requestPromised: mockRequestPromised,
  }));
  return { default: factory, __esModule: false };
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createConfigMock(overrides: Record<string, string | undefined> = {}) {
  const defaults: Record<string, string> = {
    OVH_SMS_APP_KEY: 'test-app-key',
    OVH_SMS_APP_SECRET: 'test-app-secret',
    OVH_SMS_CONSUMER_KEY: 'test-consumer-key',
    OVH_SMS_SERVICE_NAME: 'sms-test123',
    OVH_SMS_SENDER: 'PsyLib',
  };
  const merged = { ...defaults, ...overrides };
  return {
    get: vi.fn().mockImplementation((key: string) => merged[key]),
    getOrThrow: vi.fn(),
  };
}

function createService(overrides?: Record<string, string | undefined>): SmsService {
  return new SmsService(createConfigMock(overrides) as any);
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('SmsService', () => {
  beforeEach(() => {
    mockRequestPromised.mockClear();
    mockRequestPromised.mockResolvedValue({ ids: [123] });
  });

  // ─── Constructor ────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('initializes with valid OVH credentials', () => {
      expect(() => createService()).not.toThrow();
    });

    it('does not throw when OVH credentials are missing (SMS disabled)', () => {
      expect(() =>
        createService({
          OVH_SMS_APP_KEY: undefined,
          OVH_SMS_APP_SECRET: undefined,
          OVH_SMS_CONSUMER_KEY: undefined,
        }),
      ).not.toThrow();
    });
  });

  // ─── formatFrenchPhone ──────────────────────────────────────────────────

  describe('formatFrenchPhone', () => {
    it('converts 06XXXXXXXX to +336XXXXXXXX', () => {
      const service = createService();
      expect(service.formatFrenchPhone('0612345678')).toBe('+33612345678');
    });

    it('converts 07XXXXXXXX to +337XXXXXXXX', () => {
      const service = createService();
      expect(service.formatFrenchPhone('0712345678')).toBe('+33712345678');
    });

    it('keeps +33XXXXXXXXX as-is', () => {
      const service = createService();
      expect(service.formatFrenchPhone('+33612345678')).toBe('+33612345678');
    });

    it('handles phone with spaces', () => {
      const service = createService();
      expect(service.formatFrenchPhone('06 12 34 56 78')).toBe('+33612345678');
    });

    it('handles phone with dots', () => {
      const service = createService();
      expect(service.formatFrenchPhone('06.12.34.56.78')).toBe('+33612345678');
    });

    it('handles phone with dashes', () => {
      const service = createService();
      expect(service.formatFrenchPhone('06-12-34-56-78')).toBe('+33612345678');
    });

    it('handles 33XXXXXXXXX without +', () => {
      const service = createService();
      expect(service.formatFrenchPhone('33612345678')).toBe('+33612345678');
    });

    it('returns null for invalid phone number', () => {
      const service = createService();
      expect(service.formatFrenchPhone('123')).toBeNull();
    });

    it('returns null for empty string', () => {
      const service = createService();
      expect(service.formatFrenchPhone('')).toBeNull();
    });
  });

  // ─── buildReminderMessage ───────────────────────────────────────────────

  describe('buildReminderMessage', () => {
    it('includes profile URL when provided', () => {
      const service = createService();
      const msg = service.buildReminderMessage({
        patientName: 'Alice',
        psychologistName: 'Dr. Martin',
        scheduledAt: new Date('2026-04-15T10:00:00Z'),
        duration: 50,
        profileUrl: 'https://psylib.eu/psy/dr-martin',
      });

      expect(msg).toContain('https://psylib.eu/psy/dr-martin');
      expect(msg).not.toContain('contactez votre psychologue');
    });

    it('falls back to "contactez votre psychologue" without profileUrl', () => {
      const service = createService();
      const msg = service.buildReminderMessage({
        patientName: 'Alice',
        psychologistName: 'Dr. Martin',
        scheduledAt: new Date('2026-04-15T10:00:00Z'),
        duration: 50,
      });

      expect(msg).toContain('contactez votre psychologue');
    });

    it('includes psychologist name in message', () => {
      const service = createService();
      const msg = service.buildReminderMessage({
        patientName: 'Alice',
        psychologistName: 'Dr. Martin',
        scheduledAt: new Date('2026-04-15T10:00:00Z'),
        duration: 50,
      });

      expect(msg).toContain('Dr. Martin');
    });

    it('includes duration in message', () => {
      const service = createService();
      const msg = service.buildReminderMessage({
        patientName: 'Alice',
        psychologistName: 'Dr. Martin',
        scheduledAt: new Date('2026-04-15T10:00:00Z'),
        duration: 50,
      });

      expect(msg).toContain('50min');
    });

    it('starts with "Rappel PsyLib"', () => {
      const service = createService();
      const msg = service.buildReminderMessage({
        patientName: 'Alice',
        psychologistName: 'Dr. Martin',
        scheduledAt: new Date('2026-04-15T10:00:00Z'),
        duration: 50,
      });

      expect(msg).toMatch(/^Rappel PsyLib/);
    });
  });

  // ─── sendAppointmentReminder ────────────────────────────────────────────

  describe('sendAppointmentReminder', () => {
    const reminderData = {
      patientName: 'Alice Dupont',
      psychologistName: 'Dr. Martin',
      scheduledAt: new Date('2026-04-15T10:00:00Z'),
      duration: 50,
    };

    it('calls OVH API with correct phone number', async () => {
      const service = createService();
      await service.sendAppointmentReminder('0612345678', reminderData);

      expect(mockRequestPromised).toHaveBeenCalledOnce();
      const [method, path, body] = mockRequestPromised.mock.calls[0] as [string, string, { receivers: string[] }];
      expect(method).toBe('POST');
      expect(path).toBe('/sms/sms-test123/jobs');
      expect(body.receivers).toEqual(['+33612345678']);
    });

    it('uses configured sender name', async () => {
      const service = createService();
      await service.sendAppointmentReminder('0612345678', reminderData);

      const [, , body] = mockRequestPromised.mock.calls[0] as [string, string, { sender: string }];
      expect(body.sender).toBe('PsyLib');
    });

    it('does not throw on OVH API error — logs only', async () => {
      const service = createService();
      mockRequestPromised.mockRejectedValueOnce(new Error('OVH API error'));

      await expect(
        service.sendAppointmentReminder('0612345678', reminderData),
      ).resolves.toBeUndefined();
    });

    it('skips sending when phone is invalid', async () => {
      const service = createService();
      await service.sendAppointmentReminder('123', reminderData);

      expect(mockRequestPromised).not.toHaveBeenCalled();
    });

    it('skips sending when OVH credentials are missing', async () => {
      const service = createService({
        OVH_SMS_APP_KEY: undefined,
        OVH_SMS_APP_SECRET: undefined,
        OVH_SMS_CONSUMER_KEY: undefined,
      });
      await service.sendAppointmentReminder('0612345678', reminderData);

      expect(mockRequestPromised).not.toHaveBeenCalled();
    });
  });
});
