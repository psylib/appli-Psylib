import { NotFoundException, BadRequestException } from '@nestjs/common';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PublicBookingService } from './public-booking.service';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockPsy = {
  id: 'psy-id',
  name: 'Dr. Martin',
  slug: 'dr-martin',
  defaultSessionDuration: 50,
  user: { email: 'dr.martin@test.fr' },
};

const mockPatient = {
  id: 'patient-id',
  name: 'Alice Dupont',
  email: 'alice@test.fr',
  psychologistId: 'psy-id',
};

const validBookingDto = {
  patientName: 'Alice Dupont',
  patientEmail: 'alice@test.fr',
  patientPhone: '0601020304',
  scheduledAt: new Date(Date.now() + 86400000).toISOString(),
  reason: 'Consultation initiale',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createPrismaMock() {
  return {
    psychologist: {
      findUnique: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
    },
    appointment: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: 'appt-id' }),
    },
    patient: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(mockPatient),
    },
    psyNetworkProfile: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  };
}

function createAvailabilityMock() {
  return {
    getAvailableTimeslots: vi.fn().mockResolvedValue([]),
  };
}

function createEmailMock() {
  return {
    sendBookingRequestToPsy: vi.fn().mockResolvedValue(undefined),
    sendBookingReceivedToPatient: vi.fn().mockResolvedValue(undefined),
  };
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('PublicBookingService', () => {
  let service: PublicBookingService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let availabilityService: ReturnType<typeof createAvailabilityMock>;
  let emailService: ReturnType<typeof createEmailMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    availabilityService = createAvailabilityMock();
    emailService = createEmailMock();
    service = new PublicBookingService(prisma as any, availabilityService as any, emailService as any);
  });

  // ─── getPublicProfile ────────────────────────────────────────────────────

  describe('getPublicProfile', () => {
    it('throws NotFoundException when slug not found', async () => {
      prisma.psychologist.findUnique.mockResolvedValue(null);
      await expect(service.getPublicProfile('inconnu')).rejects.toThrow(NotFoundException);
    });

    it('returns public profile data', async () => {
      prisma.psychologist.findUnique.mockResolvedValue({
        id: 'psy-id',
        name: 'Dr. Martin',
        slug: 'dr-martin',
        specialization: 'TCC',
        bio: 'Bio test',
        phone: '0601020304',
        address: '1 rue test',
        adeliNumber: '12345678',
        defaultSessionDuration: 50,
        defaultSessionRate: 80,
        networkProfile: {
          city: 'Nancy',
          department: '54',
          approaches: ['TCC'],
          specialties: ['Anxiété'],
          languages: ['fr'],
          isVisible: true,
          avatarUrl: null,
          websiteUrl: null,
          acceptsMonPsy: true,
          offersVisio: false,
        },
        user: { avatarUrl: null },
      });

      const profile = await service.getPublicProfile('dr-martin');

      expect(profile).toMatchObject({ name: 'Dr. Martin', slug: 'dr-martin', city: 'Nancy', acceptsMonPsy: true });
    });

    it('does not expose psy email in public profile', async () => {
      prisma.psychologist.findUnique.mockResolvedValue({
        id: 'psy-id', name: 'Dr. Martin', slug: 'dr-martin',
        specialization: null, bio: null, phone: null, address: null,
        adeliNumber: null, defaultSessionDuration: 50, defaultSessionRate: null,
        networkProfile: null, user: { avatarUrl: null },
      });

      const profile = await service.getPublicProfile('dr-martin');
      expect(profile).not.toHaveProperty('email');
    });
  });

  // ─── getAvailableSlots ───────────────────────────────────────────────────

  describe('getAvailableSlots', () => {
    it('throws NotFoundException when slug unknown', async () => {
      prisma.psychologist.findUnique.mockResolvedValue(null);
      await expect(
        service.getAvailableSlots('inconnu', new Date().toISOString(), new Date().toISOString()),
      ).rejects.toThrow(NotFoundException);
    });

    it('caps date range to 30 days max', async () => {
      prisma.psychologist.findUnique.mockResolvedValue({ id: 'psy-id', defaultSessionDuration: 50 });
      const from = new Date();
      const to = new Date(from.getTime() + 90 * 86400000); // 90 days — too far

      await service.getAvailableSlots('dr-martin', from.toISOString(), to.toISOString());

      const [, , effectiveTo] = availabilityService.getAvailableTimeslots.mock.calls[0] as [string, Date, Date];
      const diffDays = (effectiveTo.getTime() - from.getTime()) / 86400000;
      expect(diffDays).toBeLessThanOrEqual(30.1);
    });

    it('returns ISO strings for each available slot', async () => {
      prisma.psychologist.findUnique.mockResolvedValue({ id: 'psy-id', defaultSessionDuration: 50 });
      const slot1 = new Date('2026-04-01T10:00:00Z');
      const slot2 = new Date('2026-04-01T11:00:00Z');
      availabilityService.getAvailableTimeslots.mockResolvedValue([slot1, slot2]);

      const result = await service.getAvailableSlots(
        'dr-martin',
        '2026-04-01T00:00:00Z',
        '2026-04-07T00:00:00Z',
      );

      expect(result.slots).toHaveLength(2);
      expect(result.slots[0]).toBe(slot1.toISOString());
    });
  });

  // ─── bookAppointment ─────────────────────────────────────────────────────

  describe('bookAppointment', () => {
    beforeEach(() => {
      prisma.psychologist.findUnique.mockResolvedValue(mockPsy);
    });

    it('throws NotFoundException when psy slug not found', async () => {
      prisma.psychologist.findUnique.mockResolvedValue(null);
      await expect(service.bookAppointment('inconnu', validBookingDto)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException on slot conflict', async () => {
      prisma.appointment.findFirst.mockResolvedValue({ id: 'existing-appt' });
      await expect(service.bookAppointment('dr-martin', validBookingDto)).rejects.toThrow(BadRequestException);
    });

    it('creates a new patient when email not already registered', async () => {
      prisma.patient.findFirst.mockResolvedValue(null);

      await service.bookAppointment('dr-martin', validBookingDto);

      expect(prisma.patient.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: validBookingDto.patientEmail,
            psychologistId: mockPsy.id,
            source: 'public',
          }),
        }),
      );
    });

    it('reuses existing patient — no create call', async () => {
      prisma.patient.findFirst.mockResolvedValue(mockPatient);

      await service.bookAppointment('dr-martin', validBookingDto);

      expect(prisma.patient.create).not.toHaveBeenCalled();
    });

    it('creates appointment with correct status and source', async () => {
      await service.bookAppointment('dr-martin', validBookingDto);

      expect(prisma.appointment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            psychologistId: mockPsy.id,
            status: 'scheduled',
            source: 'public',
            duration: mockPsy.defaultSessionDuration,
          }),
        }),
      );
    });

    it('returns success with appointmentId', async () => {
      prisma.appointment.create.mockResolvedValue({ id: 'new-appt-id' });

      const result = await service.bookAppointment('dr-martin', validBookingDto);

      expect(result).toEqual({ success: true, appointmentId: 'new-appt-id' });
    });

    it('fires emails non-blocking and still returns success', async () => {
      // Emails are void (fire-and-forget) — booking succeeds regardless
      const result = await service.bookAppointment('dr-martin', validBookingDto);

      expect(result.success).toBe(true);
      expect(emailService.sendBookingRequestToPsy).toHaveBeenCalledOnce();
      expect(emailService.sendBookingReceivedToPatient).toHaveBeenCalledOnce();
    });
  });

  // ─── matchPsychologists ──────────────────────────────────────────────────

  describe('matchPsychologists', () => {
    function buildProfile(approaches: string[], id = `profile-${approaches.join('-')}`) {
      return {
        id,
        city: 'Nancy',
        department: '54',
        approaches,
        specialties: [],
        languages: ['fr'],
        acceptsReferrals: true,
        acceptsMonPsy: false,
        offersVisio: false,
        bio: null,
        psychologist: { id: 'psy-1', name: 'Dr. Test', slug: 'dr-test', specialization: 'TCC' },
      };
    }

    it('returns empty array when no profiles found', async () => {
      prisma.psyNetworkProfile.findMany.mockResolvedValue([]);
      const result = await service.matchPsychologists({});
      expect(result).toEqual([]);
    });

    it('assigns default score 0.7 when no approach preference given', async () => {
      prisma.psyNetworkProfile.findMany.mockResolvedValue([buildProfile(['TCC'])]);
      const [r] = await service.matchPsychologists({});
      expect(r!.matchScore).toBe(0.7);
    });

    it('gives higher score when approach matches', async () => {
      prisma.psyNetworkProfile.findMany.mockResolvedValue([
        buildProfile(['TCC'], 'p1'),
        buildProfile(['psychanalyse'], 'p2'),
      ]);

      const results = await service.matchPsychologists({ approaches: ['TCC'] });

      const tcc = results.find((r) => r.approaches.includes('TCC'));
      const psy = results.find((r) => r.approaches.includes('psychanalyse'));
      expect(tcc!.matchScore).toBeGreaterThan(psy!.matchScore);
    });

    it('gives score 0.3 when no approach matches at all', async () => {
      prisma.psyNetworkProfile.findMany.mockResolvedValue([buildProfile(['psychanalyse'])]);
      const [r] = await service.matchPsychologists({ approaches: ['TCC'] });
      expect(r!.matchScore).toBe(0.3);
    });

    it('gives score 0.5 when psy has no listed approaches', async () => {
      prisma.psyNetworkProfile.findMany.mockResolvedValue([buildProfile([])]);
      const [r] = await service.matchPsychologists({ approaches: ['TCC'] });
      expect(r!.matchScore).toBe(0.5);
    });

    it('sorts results by matchScore descending', async () => {
      prisma.psyNetworkProfile.findMany.mockResolvedValue([
        buildProfile(['psychanalyse'], 'p1'),
        buildProfile(['TCC'], 'p2'),
      ]);

      const results = await service.matchPsychologists({ approaches: ['TCC'] });
      expect(results[0]!.matchScore).toBeGreaterThanOrEqual(results[1]!.matchScore);
    });

    it('limits results to 20 maximum', async () => {
      const manyProfiles = Array.from({ length: 25 }, (_, i) => buildProfile([`approche-${i}`], `p${i}`));
      prisma.psyNetworkProfile.findMany.mockResolvedValue(manyProfiles);

      const results = await service.matchPsychologists({});
      expect(results.length).toBeLessThanOrEqual(20);
    });
  });
});
