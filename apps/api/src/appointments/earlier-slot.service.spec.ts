import { vi } from 'vitest';
import { EarlierSlotService } from './earlier-slot.service';

describe('EarlierSlotService.notifyFreedSlot', () => {
  const psyId = 'psy-1';
  const freedAt = new Date('2026-07-01T09:00:00.000Z');

  function build(overrides: {
    eligible?: any[];
    psy?: any;
    slots?: Date[];
  }) {
    const prisma = {
      psychologist: { findUnique: vi.fn().mockResolvedValue(overrides.psy ?? { id: psyId, name: 'Dr X', earlierSlotEnabled: true }) },
      appointment: {
        findMany: vi.fn().mockResolvedValue(overrides.eligible ?? []),
        update: vi.fn().mockResolvedValue({}),
      },
    } as any;
    const availability = {
      getAvailableTimeslots: vi.fn().mockResolvedValue(overrides.slots ?? [freedAt]),
    } as any;
    const email = { sendEarlierSlotAvailable: vi.fn().mockResolvedValue(undefined) } as any;
    const config = { get: vi.fn().mockReturnValue('https://psylib.eu') } as any;
    const svc = new EarlierSlotService(prisma, availability, email, config);
    return { svc, prisma, availability, email };
  }

  it('emails an eligible later appointment when the freed slot fits its duration', async () => {
    const { svc, email, prisma } = build({
      eligible: [
        { id: 'a1', patientId: 'p1', scheduledAt: new Date('2026-07-10T10:00:00.000Z'), duration: 50, earlierSlotToken: 'tok-1', patient: { name: 'Alice', email: 'alice@example.com' } },
      ],
      slots: [freedAt],
    });

    await svc.notifyFreedSlot(psyId, freedAt);

    expect(email.sendEarlierSlotAvailable).toHaveBeenCalledTimes(1);
    expect(email.sendEarlierSlotAvailable).toHaveBeenCalledWith(
      'alice@example.com',
      expect.objectContaining({ claimUrl: 'https://psylib.eu/rebook/tok-1' }),
    );
    expect(prisma.appointment.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'a1' }, data: expect.objectContaining({ earlierSlotNotifiedAt: expect.any(Date) }) }),
    );
  });

  it('does NOT email when the freed slot does not actually fit (not in available timeslots)', async () => {
    const { svc, email } = build({
      eligible: [
        { id: 'a1', patientId: 'p1', scheduledAt: new Date('2026-07-10T10:00:00.000Z'), duration: 50, earlierSlotToken: 'tok-1', patient: { name: 'Alice', email: 'alice@example.com' } },
      ],
      slots: [], // availability says freedAt is not really free
    });

    await svc.notifyFreedSlot(psyId, freedAt);

    expect(email.sendEarlierSlotAvailable).not.toHaveBeenCalled();
  });

  it('does nothing when the psychologist has earlierSlotEnabled=false', async () => {
    const { svc, email, prisma } = build({
      psy: { id: psyId, name: 'Dr X', earlierSlotEnabled: false },
    });

    await svc.notifyFreedSlot(psyId, freedAt);

    expect(prisma.appointment.findMany).not.toHaveBeenCalled();
    expect(email.sendEarlierSlotAvailable).not.toHaveBeenCalled();
  });

  it('does nothing for a past freed slot', async () => {
    const { svc, prisma } = build({});
    await svc.notifyFreedSlot(psyId, new Date('2020-01-01T09:00:00.000Z'));
    expect(prisma.psychologist.findUnique).not.toHaveBeenCalled();
  });
});
