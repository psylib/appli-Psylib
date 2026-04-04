import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ReminderService } from '../reminder.service';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPrisma = {
  psychologist: {
    findMany: vi.fn(),
  },
  appointment: {
    findMany: vi.fn(),
    update: vi.fn(),
  },
};

const mockEmail = {
  sendAppointmentReminder: vi.fn(),
};

const mockSms = {
  sendSms: vi.fn(),
};

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PSY_ID = 'psy-001';

const basePsy = {
  id: PSY_ID,
  name: 'Dr. Dupont',
  address: '10 rue de la Paix, Paris',
  reminderDelay: 24,
  reminderEmailEnabled: true,
  reminderSmsEnabled: false,
  reminderTemplate: null,
};

function futureDate(hoursFromNow: number): Date {
  return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
}

const baseAppointment = {
  id: 'appt-001',
  psychologistId: PSY_ID,
  scheduledAt: futureDate(12),
  duration: 50,
  status: 'scheduled',
  reminderSentAt: null,
  patient: {
    name: 'Jean Martin',
    email: 'jean@example.com',
    phone: '+33612345678',
  },
  consultationType: {
    name: 'Suivi individuel',
    duration: 50,
  },
};

// ---------------------------------------------------------------------------
// Helper to build the service with mocks
// ---------------------------------------------------------------------------

function createService(): ReminderService {
  return new ReminderService(
    mockPrisma as any,
    mockEmail as any,
    mockSms as any,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ReminderService', () => {
  let service: ReminderService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = createService();
  });

  // ── processReminders ────────────────────────────────────────────────────

  describe('processReminders', () => {
    it('finds appointments within delay window and sends email', async () => {
      mockPrisma.psychologist.findMany.mockResolvedValue([basePsy]);
      mockPrisma.appointment.findMany.mockResolvedValue([baseAppointment]);
      mockPrisma.appointment.update.mockResolvedValue({});

      await service.processReminders();

      expect(mockPrisma.psychologist.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { reminderEmailEnabled: true },
            { reminderSmsEnabled: true },
          ],
        },
        select: {
          id: true,
          name: true,
          address: true,
          reminderDelay: true,
          reminderEmailEnabled: true,
          reminderSmsEnabled: true,
          reminderTemplate: true,
        },
      });

      expect(mockEmail.sendAppointmentReminder).toHaveBeenCalledWith(
        'jean@example.com',
        expect.objectContaining({
          patientName: 'Jean Martin',
          psychologistName: 'Dr. Dupont',
          scheduledAt: baseAppointment.scheduledAt,
          duration: 50,
          motif: 'Suivi individuel',
        }),
      );
    });

    it('sends SMS when smsEnabled is true', async () => {
      const smsPsy = { ...basePsy, reminderSmsEnabled: true };
      mockPrisma.psychologist.findMany.mockResolvedValue([smsPsy]);
      mockPrisma.appointment.findMany.mockResolvedValue([baseAppointment]);
      mockPrisma.appointment.update.mockResolvedValue({});
      mockSms.sendSms.mockResolvedValue({ success: true });

      await service.processReminders();

      expect(mockSms.sendSms).toHaveBeenCalledWith(
        '+33612345678',
        expect.stringContaining('Dr. Dupont'),
      );
    });

    it('does not send SMS when smsEnabled is false', async () => {
      mockPrisma.psychologist.findMany.mockResolvedValue([basePsy]);
      mockPrisma.appointment.findMany.mockResolvedValue([baseAppointment]);
      mockPrisma.appointment.update.mockResolvedValue({});

      await service.processReminders();

      expect(mockSms.sendSms).not.toHaveBeenCalled();
    });

    it('marks reminderSentAt after sending', async () => {
      mockPrisma.psychologist.findMany.mockResolvedValue([basePsy]);
      mockPrisma.appointment.findMany.mockResolvedValue([baseAppointment]);
      mockPrisma.appointment.update.mockResolvedValue({});

      await service.processReminders();

      expect(mockPrisma.appointment.update).toHaveBeenCalledWith({
        where: { id: 'appt-001' },
        data: { reminderSentAt: expect.any(Date) },
      });
    });

    it('skips appointments already reminded (reminderSentAt not null)', async () => {
      mockPrisma.psychologist.findMany.mockResolvedValue([basePsy]);
      // Return no appointments (the query already filters out reminderSentAt != null)
      mockPrisma.appointment.findMany.mockResolvedValue([]);

      await service.processReminders();

      // Verify the query filters for reminderSentAt: null
      expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            reminderSentAt: null,
          }),
        }),
      );
      expect(mockEmail.sendAppointmentReminder).not.toHaveBeenCalled();
      expect(mockPrisma.appointment.update).not.toHaveBeenCalled();
    });

    it('handles errors gracefully without crashing', async () => {
      mockPrisma.psychologist.findMany.mockResolvedValue([basePsy]);
      mockPrisma.appointment.findMany.mockResolvedValue([baseAppointment]);
      mockEmail.sendAppointmentReminder.mockRejectedValue(new Error('SMTP timeout'));

      // Should not throw
      await expect(service.processReminders()).resolves.not.toThrow();

      // Should not update reminderSentAt on failure
      expect(mockPrisma.appointment.update).not.toHaveBeenCalled();
    });

    it('does nothing when no psychologists have reminders enabled', async () => {
      mockPrisma.psychologist.findMany.mockResolvedValue([]);

      await service.processReminders();

      expect(mockPrisma.appointment.findMany).not.toHaveBeenCalled();
      expect(mockEmail.sendAppointmentReminder).not.toHaveBeenCalled();
    });

    it('uses appointment duration when consultationType is null', async () => {
      const apptNoType = {
        ...baseAppointment,
        consultationType: null,
        duration: 45,
      };
      mockPrisma.psychologist.findMany.mockResolvedValue([basePsy]);
      mockPrisma.appointment.findMany.mockResolvedValue([apptNoType]);
      mockPrisma.appointment.update.mockResolvedValue({});

      await service.processReminders();

      expect(mockEmail.sendAppointmentReminder).toHaveBeenCalledWith(
        'jean@example.com',
        expect.objectContaining({
          duration: 45,
          motif: 'Consultation',
        }),
      );
    });

    it('does not send email when patient has no email', async () => {
      const apptNoEmail = {
        ...baseAppointment,
        patient: { ...baseAppointment.patient, email: null },
      };
      mockPrisma.psychologist.findMany.mockResolvedValue([basePsy]);
      mockPrisma.appointment.findMany.mockResolvedValue([apptNoEmail]);
      mockPrisma.appointment.update.mockResolvedValue({});

      await service.processReminders();

      expect(mockEmail.sendAppointmentReminder).not.toHaveBeenCalled();
      // Should still mark as sent (no channel available is not an error)
      expect(mockPrisma.appointment.update).toHaveBeenCalled();
    });

    it('uses custom template for email when reminderTemplate is set', async () => {
      const customPsy = {
        ...basePsy,
        reminderTemplate: 'Bonjour {patient_name}, RDV le {date} a {heure}.',
      };
      mockPrisma.psychologist.findMany.mockResolvedValue([customPsy]);
      mockPrisma.appointment.findMany.mockResolvedValue([baseAppointment]);
      mockPrisma.appointment.update.mockResolvedValue({});

      await service.processReminders();

      expect(mockEmail.sendAppointmentReminder).toHaveBeenCalledWith(
        'jean@example.com',
        expect.objectContaining({
          customMessage: expect.stringContaining('Jean Martin'),
        }),
      );
    });

    it('queries only scheduled and confirmed appointments', async () => {
      mockPrisma.psychologist.findMany.mockResolvedValue([basePsy]);
      mockPrisma.appointment.findMany.mockResolvedValue([]);

      await service.processReminders();

      expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: ['scheduled', 'confirmed'] },
          }),
        }),
      );
    });
  });

  // ── substituteTemplate ──────────────────────────────────────────────────

  describe('substituteTemplate', () => {
    it('replaces all template variables', () => {
      const template = 'Bonjour {patient_name}, RDV avec {psy_name} le {date} a {heure}.';
      const vars = {
        patient_name: 'Jean Martin',
        psy_name: 'Dr. Dupont',
        date: 'lundi 5 janvier',
        heure: '14:00',
      };

      const result = service.substituteTemplate(template, vars);

      expect(result).toBe('Bonjour Jean Martin, RDV avec Dr. Dupont le lundi 5 janvier a 14:00.');
    });

    it('preserves unknown variables', () => {
      const template = 'Hello {name}, your {unknown_var} is ready.';
      const vars = { name: 'Jean' };

      const result = service.substituteTemplate(template, vars);

      expect(result).toBe('Hello Jean, your {unknown_var} is ready.');
    });

    it('returns empty string for null template', () => {
      const result = service.substituteTemplate(null, { name: 'Jean' });

      expect(result).toBe('');
    });

    it('handles template with no variables', () => {
      const template = 'Rappel de votre rendez-vous.';
      const result = service.substituteTemplate(template, {});

      expect(result).toBe('Rappel de votre rendez-vous.');
    });

    it('handles multiple occurrences of same variable', () => {
      const template = '{name} a un RDV. Rappel pour {name}.';
      const result = service.substituteTemplate(template, { name: 'Jean' });

      expect(result).toBe('Jean a un RDV. Rappel pour Jean.');
    });
  });
});
