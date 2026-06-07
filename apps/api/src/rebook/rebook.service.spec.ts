import { vi } from 'vitest';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { RebookService } from './rebook.service';

describe('RebookService', () => {
  const current = new Date('2026-07-10T10:00:00.000Z');
  const earlier = new Date('2026-07-02T09:00:00.000Z');

  function build(opts: { appt?: any; slots?: Date[] } = {}) {
    const appt = opts.appt ?? {
      id: 'a1',
      psychologistId: 'psy-1',
      patientId: 'p1',
      scheduledAt: current,
      duration: 50,
      status: 'confirmed',
      cancelToken: 'cancel-1',
      earlierSlotToken: 'tok-1',
      notifyEarlierSlot: true,
      psychologist: { id: 'psy-1', name: 'Dr X', slug: 'dr-x' },
    };
    const tx = {
      appointment: {
        findUnique: vi.fn().mockResolvedValue({ status: 'confirmed' }),
        findMany: vi.fn().mockResolvedValue([]),
        update: vi.fn().mockResolvedValue({ ...appt, scheduledAt: earlier }),
      },
    };
    const prisma = {
      appointment: {
        findFirst: vi.fn().mockResolvedValue(appt),
        update: vi.fn().mockResolvedValue(appt),
      },
      patient: { findUnique: vi.fn().mockResolvedValue({ name: 'Alice', email: 'a@x.fr' }) },
      $transaction: vi.fn(async (fn: any) => fn(tx)),
    } as any;
    const availability = { getAvailableTimeslots: vi.fn().mockResolvedValue(opts.slots ?? [earlier]) } as any;
    const email = { sendBookingReceivedToPatient: vi.fn().mockResolvedValue(undefined) } as any;
    const config = { get: vi.fn().mockReturnValue('https://psylib.eu') } as any;
    const emitter = { emit: vi.fn() } as any;
    const audit = { log: vi.fn().mockResolvedValue(undefined) } as any;
    const svc = new RebookService(prisma, availability, email, config, emitter, audit);
    return { svc, prisma, availability, emitter, tx };
  }

  it('getByToken throws on unknown token', async () => {
    const { svc, prisma } = build();
    prisma.appointment.findFirst.mockResolvedValueOnce(null);
    await expect(svc.getByToken('nope')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('listEarlierSlots returns only slots strictly before the current appointment', async () => {
    const later = new Date('2026-07-20T09:00:00.000Z');
    const { svc } = build({ slots: [earlier, later] });
    const res = await svc.listEarlierSlots('tok-1');
    expect(res.slots).toEqual([earlier.toISOString()]);
    expect(res.currentDate).toBe(current.toISOString());
  });

  it('moveToSlot rejects a slot not earlier than current', async () => {
    const { svc } = build();
    await expect(svc.moveToSlot('tok-1', current.toISOString())).rejects.toBeInstanceOf(BadRequestException);
  });

  it('moveToSlot updates the appointment and emits slot.freed for the old time', async () => {
    const { svc, emitter, tx } = build({ slots: [earlier] });
    await svc.moveToSlot('tok-1', earlier.toISOString());
    expect(tx.appointment.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'a1' }, data: expect.objectContaining({ scheduledAt: earlier }) }),
    );
    expect(emitter.emit).toHaveBeenCalledWith('slot.freed', { psychologistId: 'psy-1', freedAt: current });
  });

  it('unsubscribe sets notifyEarlierSlot=false', async () => {
    const { svc, prisma } = build();
    const res = await svc.unsubscribe('tok-1');
    expect(prisma.appointment.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { notifyEarlierSlot: false } }),
    );
    expect(res).toEqual({ success: true });
  });

  it('moveToSlot throws ConflictException when the slot is already taken', async () => {
    const { svc, tx } = build({ slots: [earlier] });
    tx.appointment.findMany.mockResolvedValueOnce([{ scheduledAt: earlier, duration: 50 }]);
    await expect(svc.moveToSlot('tok-1', earlier.toISOString())).rejects.toBeInstanceOf(ConflictException);
  });
});
