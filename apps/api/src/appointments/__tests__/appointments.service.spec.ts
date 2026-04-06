import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { AppointmentsService } from '../appointments.service';
import type { Psychologist, Appointment } from '@prisma/client';

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockPrisma = {
  psychologist: {
    findUnique: vi.fn(),
  },
  patient: {
    findFirst: vi.fn(),
  },
  appointment: {
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
};

const mockAudit = {
  log: vi.fn(),
};

const mockEmail = {
  sendAppointmentConfirmation: vi.fn(),
  sendBookingDeclined: vi.fn(),
  sendRefundConfirmation: vi.fn(),
  sendCancellationNotification: vi.fn(),
};

const mockStripeService = {
  createRefund: vi.fn(),
};

const mockWaitlist = {
  onAppointmentCancelled: vi.fn(),
};

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const PSY_USER_ID = 'psy-user-uuid';
const PSY_ID = 'psy-db-uuid';
const PATIENT_ID = 'patient-uuid';
const APPOINTMENT_ID = 'appointment-uuid';

const mockPsychologist = {
  id: PSY_ID,
  userId: PSY_USER_ID,
  name: 'Dr. Test',
  slug: 'dr-test',
} as Psychologist;

function makeAppointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: APPOINTMENT_ID,
    psychologistId: PSY_ID,
    patientId: PATIENT_ID,
    sessionId: null,
    scheduledAt: new Date('2026-04-01T10:00:00Z'),
    duration: 50,
    status: 'scheduled',
    source: null,
    reminderSentAt: null,
    smsReminderSentAt: null,
    createdAt: new Date('2026-03-20'),
    updatedAt: new Date('2026-03-20'),
    ...overrides,
  } as Appointment;
}

// ─── Service factory ───────────────────────────────────────────────────────────
function createService(): AppointmentsService {
  return new AppointmentsService(
    mockPrisma as never,
    mockAudit as never,
    mockEmail as never,
    mockStripeService as never,
    mockWaitlist as never,
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('AppointmentsService', () => {
  let service: AppointmentsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = createService();
  });

  // ── create() ────────────────────────────────────────────────────────────────
  describe('create()', () => {
    it('should create an appointment with scheduled status', async () => {
      const created = makeAppointment();
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.patient.findFirst.mockResolvedValueOnce({ name: 'Marie', email: 'marie@test.com' });
      mockPrisma.appointment.create.mockResolvedValueOnce(created);

      const result = await service.create(PSY_USER_ID, {
        patientId: PATIENT_ID,
        scheduledAt: '2026-04-01T10:00:00Z',
        duration: 50,
      });

      expect(result).toEqual(created);
      expect(mockPrisma.appointment.create).toHaveBeenCalledOnce();
      const data = mockPrisma.appointment.create.mock.calls[0]?.[0]?.data as {
        psychologistId: string;
        status: string;
        duration: number;
      };
      expect(data.psychologistId).toBe(PSY_ID);
      expect(data.status).toBe('scheduled');
      expect(data.duration).toBe(50);
    });

    it('should send confirmation email when patient has an email', async () => {
      const created = makeAppointment();
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.patient.findFirst.mockResolvedValueOnce({ name: 'Marie', email: 'marie@test.com' });
      mockPrisma.appointment.create.mockResolvedValueOnce(created);

      await service.create(PSY_USER_ID, {
        patientId: PATIENT_ID,
        scheduledAt: '2026-04-01T10:00:00Z',
        duration: 50,
      });

      expect(mockEmail.sendAppointmentConfirmation).toHaveBeenCalledWith('marie@test.com', expect.objectContaining({
        patientName: 'Marie',
        psychologistName: 'Dr. Test',
      }));
    });

    it('should not send email when patient has no email', async () => {
      const created = makeAppointment();
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.patient.findFirst.mockResolvedValueOnce({ name: 'Marie', email: null });
      mockPrisma.appointment.create.mockResolvedValueOnce(created);

      await service.create(PSY_USER_ID, {
        patientId: PATIENT_ID,
        scheduledAt: '2026-04-01T10:00:00Z',
        duration: 50,
      });

      expect(mockEmail.sendAppointmentConfirmation).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when patient does not exist', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.patient.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.create(PSY_USER_ID, {
          patientId: 'nonexistent',
          scheduledAt: '2026-04-01T10:00:00Z',
          duration: 50,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when psychologist does not exist', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.create(PSY_USER_ID, {
          patientId: PATIENT_ID,
          scheduledAt: '2026-04-01T10:00:00Z',
          duration: 50,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should filter patient by psychologistId (tenant isolation)', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.patient.findFirst.mockResolvedValueOnce({ name: 'Marie', email: null });
      mockPrisma.appointment.create.mockResolvedValueOnce(makeAppointment());

      await service.create(PSY_USER_ID, {
        patientId: PATIENT_ID,
        scheduledAt: '2026-04-01T10:00:00Z',
        duration: 50,
      });

      const findFirstArg = mockPrisma.patient.findFirst.mock.calls[0]?.[0] as {
        where: { psychologistId: string };
      };
      expect(findFirstArg.where.psychologistId).toBe(PSY_ID);
    });
  });

  // ── findAll() ────────────────────────────────────────────────────────────────
  describe('findAll()', () => {
    it('should filter appointments by psychologistId', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.appointment.findMany.mockResolvedValueOnce([]);

      await service.findAll(PSY_USER_ID, {});

      const findManyArg = mockPrisma.appointment.findMany.mock.calls[0]?.[0] as {
        where: { psychologistId: string };
      };
      expect(findManyArg.where.psychologistId).toBe(PSY_ID);
    });

    it('should return appointments ordered by scheduledAt ascending', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.appointment.findMany.mockResolvedValueOnce([]);

      await service.findAll(PSY_USER_ID, {});

      const findManyArg = mockPrisma.appointment.findMany.mock.calls[0]?.[0] as {
        orderBy: { scheduledAt: string };
      };
      expect(findManyArg.orderBy.scheduledAt).toBe('asc');
    });
  });

  // ── update() ────────────────────────────────────────────────────────────────
  describe('update()', () => {
    it('should update appointment fields', async () => {
      const existing = makeAppointment();
      const updated = makeAppointment({ duration: 60 });
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.appointment.findFirst.mockResolvedValueOnce(existing);
      mockPrisma.appointment.update.mockResolvedValueOnce(updated);

      const result = await service.update(PSY_USER_ID, APPOINTMENT_ID, { duration: 60 });

      expect(result.duration).toBe(60);
      expect(mockPrisma.appointment.update).toHaveBeenCalledOnce();
    });

    it('should throw NotFoundException when appointment does not exist', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.appointment.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.update(PSY_USER_ID, 'nonexistent', { duration: 60 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── cancel() ────────────────────────────────────────────────────────────────
  describe('cancel()', () => {
    it('should set status to cancelled', async () => {
      const existing = makeAppointment();
      const cancelled = makeAppointment({ status: 'cancelled' });
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.appointment.findFirst.mockResolvedValueOnce(existing);
      mockPrisma.appointment.update.mockResolvedValueOnce(cancelled);

      const result = await service.cancel(PSY_USER_ID, APPOINTMENT_ID);

      expect(result.status).toBe('cancelled');
      const updateArg = mockPrisma.appointment.update.mock.calls[0]?.[0] as {
        data: { status: string };
      };
      expect(updateArg.data.status).toBe('cancelled');
    });

    it('should throw NotFoundException when appointment does not exist', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.appointment.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.cancel(PSY_USER_ID, 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── confirmAppointment() ────────────────────────────────────────────────────
  describe('confirmAppointment()', () => {
    it('should set status to confirmed and send email', async () => {
      const existing = {
        ...makeAppointment(),
        patient: { name: 'Marie', email: 'marie@test.com' },
      };
      const updated = makeAppointment({ status: 'confirmed' });
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.appointment.findFirst.mockResolvedValueOnce(existing);
      mockPrisma.appointment.update.mockResolvedValueOnce(updated);

      const result = await service.confirmAppointment(PSY_USER_ID, APPOINTMENT_ID);

      expect(result.status).toBe('confirmed');
      expect(mockEmail.sendAppointmentConfirmation).toHaveBeenCalledWith(
        'marie@test.com',
        expect.objectContaining({ patientName: 'Marie', psychologistName: 'Dr. Test' }),
      );
    });

    it('should throw NotFoundException when appointment does not exist', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.appointment.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.confirmAppointment(PSY_USER_ID, 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── declineAppointment() ────────────────────────────────────────────────────
  describe('declineAppointment()', () => {
    it('should set status to cancelled and send decline email', async () => {
      const existing = {
        ...makeAppointment(),
        patient: { name: 'Marie', email: 'marie@test.com' },
      };
      const updated = makeAppointment({ status: 'cancelled' });
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.appointment.findFirst.mockResolvedValueOnce(existing);
      mockPrisma.appointment.update.mockResolvedValueOnce(updated);

      const result = await service.declineAppointment(PSY_USER_ID, APPOINTMENT_ID);

      expect(result.status).toBe('cancelled');
      expect(mockEmail.sendBookingDeclined).toHaveBeenCalledWith(
        'marie@test.com',
        expect.objectContaining({ patientName: 'Marie', psychologistName: 'Dr. Test' }),
      );
    });

    it('should not send decline email when patient has no email', async () => {
      const existing = {
        ...makeAppointment(),
        patient: { name: 'Marie', email: null },
      };
      const updated = makeAppointment({ status: 'cancelled' });
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.appointment.findFirst.mockResolvedValueOnce(existing);
      mockPrisma.appointment.update.mockResolvedValueOnce(updated);

      await service.declineAppointment(PSY_USER_ID, APPOINTMENT_ID);

      expect(mockEmail.sendBookingDeclined).not.toHaveBeenCalled();
    });
  });

  // ── getPending() ────────────────────────────────────────────────────────────
  describe('getPending()', () => {
    it('should return only scheduled public appointments', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.appointment.findMany.mockResolvedValueOnce([]);

      await service.getPending(PSY_USER_ID);

      const findManyArg = mockPrisma.appointment.findMany.mock.calls[0]?.[0] as {
        where: { psychologistId: string; status: string; source: string };
      };
      expect(findManyArg.where.psychologistId).toBe(PSY_ID);
      expect(findManyArg.where.status).toBe('scheduled');
      expect(findManyArg.where.source).toBe('public');
    });
  });
});
