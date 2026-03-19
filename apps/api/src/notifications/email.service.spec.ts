import { vi, describe, it, expect, beforeEach } from 'vitest';
import { EmailService } from './email.service';

// ─── Mock Resend SDK (doit être AVANT les imports du service) ─────────────────

const mockResendSend = vi.fn().mockResolvedValue({ id: 'email-test-id' });

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockResendSend },
  })),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createConfigMock(apiKey?: string, emailFrom?: string) {
  return {
    get: vi.fn().mockImplementation((key: string) => {
      if (key === 'RESEND_API_KEY') return apiKey ?? 're_test_key';
      if (key === 'EMAIL_FROM') return emailFrom ?? 'PsyLib <noreply@psylib.eu>';
      return undefined;
    }),
    getOrThrow: vi.fn(),
  };
}

function createService(apiKey?: string): EmailService {
  return new EmailService(createConfigMock(apiKey) as any);
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('EmailService', () => {
  beforeEach(() => {
    mockResendSend.mockClear();
    mockResendSend.mockResolvedValue({ id: 'email-test-id' });
  });

  // ─── Constructor ──────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('initializes successfully with valid API key', () => {
      expect(() => createService('re_valid_key')).not.toThrow();
    });

    it('throws Error when RESEND_API_KEY is missing', () => {
      const noKeyConfig = {
        get: vi.fn().mockReturnValue(undefined), // All keys → undefined
        getOrThrow: vi.fn(),
      };
      expect(() => new EmailService(noKeyConfig as any)).toThrow('RESEND_API_KEY is required');
    });
  });

  // ─── Error resilience ─────────────────────────────────────────────────────

  describe('error handling', () => {
    it('does not throw when Resend API fails — logs only', async () => {
      const service = createService();
      mockResendSend.mockRejectedValueOnce(new Error('network error'));

      await expect(
        service.sendWelcomeEmail('psy@test.fr', {
          psychologistName: 'Dr. Test',
          dashboardUrl: 'https://psylib.eu/dashboard',
        }),
      ).resolves.toBeUndefined();
    });
  });

  // ─── sendWelcomeEmail ─────────────────────────────────────────────────────

  describe('sendWelcomeEmail', () => {
    it('sends to the correct recipient', async () => {
      const service = createService();
      await service.sendWelcomeEmail('psy@test.fr', {
        psychologistName: 'Dr. Dupont',
        dashboardUrl: 'https://psylib.eu/dashboard',
      });

      expect(mockResendSend).toHaveBeenCalledOnce();
      const [params] = mockResendSend.mock.calls[0] as [{ to: string; subject: string; from: string }];
      expect(params.to).toBe('psy@test.fr');
    });

    it('uses PsyLib subject mentioning bienvenue', async () => {
      const service = createService();
      await service.sendWelcomeEmail('psy@test.fr', {
        psychologistName: 'Dr. Dupont',
        dashboardUrl: 'https://psylib.eu/dashboard',
      });

      const [params] = mockResendSend.mock.calls[0] as [{ subject: string }];
      expect(params.subject.toLowerCase()).toContain('bienvenue');
    });

    it('uses configured from address', async () => {
      const service = createService();
      await service.sendWelcomeEmail('psy@test.fr', {
        psychologistName: 'Dr. Dupont',
        dashboardUrl: 'https://psylib.eu/dashboard',
      });

      const [params] = mockResendSend.mock.calls[0] as [{ from: string }];
      expect(params.from).toBe('PsyLib <noreply@psylib.eu>');
    });
  });

  // ─── sendBookingRequestToPsy ──────────────────────────────────────────────

  describe('sendBookingRequestToPsy', () => {
    const bookingParams = {
      patientName: 'Alice Dupont',
      patientEmail: 'alice@test.fr',
      patientPhone: '0601020304',
      psychologistName: 'Dr. Martin',
      scheduledAt: new Date('2026-04-15T10:00:00Z'),
      duration: 50,
      reason: 'Consultation initiale',
      dashboardUrl: 'https://psylib.eu/dashboard/calendar',
    };

    it('sends to the psy email address', async () => {
      const service = createService();
      await service.sendBookingRequestToPsy('psy@test.fr', bookingParams);

      expect(mockResendSend).toHaveBeenCalledOnce();
      const [params] = mockResendSend.mock.calls[0] as [{ to: string }];
      expect(params.to).toBe('psy@test.fr');
    });

    it('does not throw on Resend error', async () => {
      const service = createService();
      mockResendSend.mockRejectedValueOnce(new Error('rate limit exceeded'));

      await expect(
        service.sendBookingRequestToPsy('psy@test.fr', bookingParams),
      ).resolves.toBeUndefined();
    });
  });

  // ─── sendBookingReceivedToPatient ─────────────────────────────────────────

  describe('sendBookingReceivedToPatient', () => {
    it('sends to the patient email address', async () => {
      const service = createService();
      await service.sendBookingReceivedToPatient('patient@test.fr', {
        patientName: 'Alice',
        psychologistName: 'Dr. Martin',
        scheduledAt: new Date('2026-04-15T10:00:00Z'),
        duration: 50,
      });

      expect(mockResendSend).toHaveBeenCalledOnce();
      const [params] = mockResendSend.mock.calls[0] as [{ to: string }];
      expect(params.to).toBe('patient@test.fr');
    });

    it('does not throw on Resend error', async () => {
      const service = createService();
      mockResendSend.mockRejectedValueOnce(new Error('smtp error'));

      await expect(
        service.sendBookingReceivedToPatient('patient@test.fr', {
          patientName: 'Alice',
          psychologistName: 'Dr. Martin',
          scheduledAt: new Date('2026-04-15T10:00:00Z'),
          duration: 50,
        }),
      ).resolves.toBeUndefined();
    });
  });

  // ─── sendAppointmentReminder ──────────────────────────────────────────────

  describe('sendAppointmentReminder', () => {
    it('sends reminder to the provided email address', async () => {
      const service = createService();
      await service.sendAppointmentReminder('psy@test.fr', {
        patientName: 'Alice',
        psychologistName: 'Dr. Martin',
        scheduledAt: new Date('2026-04-15T10:00:00Z'),
        duration: 50,
      });

      expect(mockResendSend).toHaveBeenCalledOnce();
    });

    it('does not throw on Resend error', async () => {
      const service = createService();
      mockResendSend.mockRejectedValueOnce(new Error('delivery error'));

      await expect(
        service.sendAppointmentReminder('psy@test.fr', {
          patientName: 'Alice',
          psychologistName: 'Dr. Martin',
          scheduledAt: new Date('2026-04-15T10:00:00Z'),
          duration: 50,
        }),
      ).resolves.toBeUndefined();
    });
  });
});
