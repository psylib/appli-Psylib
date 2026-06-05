import { vi, describe, it, expect } from 'vitest';
import { ReminderService } from './reminder.service';

// Audit 2026-06-05: les crons s'exécutent sur chaque instance sans verrou.
// processReminders doit claim chaque RDV ATOMIQUEMENT avant d'envoyer, pour ne
// pas envoyer un rappel en double quand plusieurs instances tournent.

function buildService(claimCount: number) {
  const futureDate = new Date(Date.now() + 12 * 60 * 60 * 1000);
  const prisma = {
    psychologist: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: 'psy1', name: 'Dr X', address: null, reminderDelay: 24,
          reminderEmailEnabled: true, reminderSmsEnabled: false, reminderTemplate: null,
        },
      ]),
    },
    appointment: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: 'a1', scheduledAt: futureDate, duration: 50,
          patient: { name: 'Alice', email: 'alice@test.fr', phone: null },
          consultationType: null,
        },
      ]),
      updateMany: vi.fn().mockResolvedValue({ count: claimCount }),
      update: vi.fn().mockResolvedValue({}),
    },
  };
  const email = { sendAppointmentReminder: vi.fn().mockResolvedValue(undefined) };
  const sms = { sendSms: vi.fn().mockResolvedValue(undefined) };
  const service = new ReminderService(prisma as any, email as any, sms as any);
  return { service, prisma, email };
}

describe('ReminderService.processReminders — claim atomique (anti double-envoi)', () => {
  it('envoie le rappel quand le claim atomique réussit (count=1)', async () => {
    const { service, prisma, email } = buildService(1);

    await service.processReminders();

    // claim atomique : updateMany filtré sur reminderSentAt: null
    expect(prisma.appointment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'a1', reminderSentAt: null }),
        data: expect.objectContaining({ reminderSentAt: expect.any(Date) }),
      }),
    );
    expect(email.sendAppointmentReminder).toHaveBeenCalledTimes(1);
  });

  it('N\'envoie PAS si le claim a déjà été pris par une autre instance (count=0)', async () => {
    const { service, email } = buildService(0);

    await service.processReminders();

    expect(email.sendAppointmentReminder).not.toHaveBeenCalled();
  });
});
