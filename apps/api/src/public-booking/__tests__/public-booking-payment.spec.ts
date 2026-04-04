import { NotFoundException, BadRequestException } from '@nestjs/common';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PublicBookingService } from '../public-booking.service';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockPsyBase = {
  id: 'psy-id',
  name: 'Dr. Martin',
  slug: 'dr-martin',
  defaultSessionDuration: 50,
  defaultSessionRate: 80,
  user: { email: 'dr.martin@test.fr' },
};

const mockPsyWithPayment = {
  ...mockPsyBase,
  allowOnlinePayment: true,
  stripeOnboardingComplete: true,
  stripeAccountId: 'acct_test_001',
};

const mockPsyNoPayment = {
  ...mockPsyBase,
  allowOnlinePayment: false,
  stripeOnboardingComplete: false,
  stripeAccountId: null,
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

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

function createPrismaMock() {
  return {
    psychologist: {
      findUnique: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
    },
    appointment: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: 'appt-id' }),
      update: vi.fn().mockResolvedValue({}),
      findMany: vi.fn().mockResolvedValue([]),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    patient: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(mockPatient),
    },
    psyNetworkProfile: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    consultationType: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
  };
}

function createCacheMock() {
  return {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    del: vi.fn().mockResolvedValue(undefined),
    delByPattern: vi.fn().mockResolvedValue(undefined),
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

function createStripeMock() {
  return {
    createBookingCheckoutSession: vi.fn().mockResolvedValue({
      id: 'cs_test_001',
      url: 'https://checkout.stripe.com/pay/cs_test_001',
      payment_intent: 'pi_test_001',
    }),
  };
}

function createService() {
  const prisma = createPrismaMock();
  const cache = createCacheMock();
  const availability = createAvailabilityMock();
  const email = createEmailMock();
  const stripe = createStripeMock();

  const service = new PublicBookingService(
    prisma as any,
    cache as any,
    availability as any,
    email as any,
    stripe as any,
  );

  return { service, prisma, cache, email, stripe };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PublicBookingService — Payment Flow', () => {
  // ─── bookAppointment with payOnline=true ─────────────────────────────────

  describe('bookAppointment with payOnline=true', () => {
    it('returns checkoutUrl when psy accepts online payment', async () => {
      const { service, prisma } = createService();
      prisma.psychologist.findUnique.mockResolvedValue(mockPsyWithPayment);
      prisma.appointment.create.mockResolvedValue({ id: 'appt-pay-001' });

      const result = await service.bookAppointment('dr-martin', {
        ...validBookingDto,
        payOnline: true,
      });

      expect(result).toMatchObject({
        success: true,
        appointmentId: 'appt-pay-001',
        checkoutUrl: expect.stringContaining('checkout.stripe.com'),
        requiresPayment: true,
      });
    });

    it('creates appointment with bookingPaymentStatus pending_payment', async () => {
      const { service, prisma } = createService();
      prisma.psychologist.findUnique.mockResolvedValue(mockPsyWithPayment);

      await service.bookAppointment('dr-martin', {
        ...validBookingDto,
        payOnline: true,
      });

      expect(prisma.appointment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            bookingPaymentStatus: 'pending_payment',
          }),
        }),
      );
    });

    it('calls stripeService.createBookingCheckoutSession with correct amount', async () => {
      const { service, prisma, stripe } = createService();
      prisma.psychologist.findUnique.mockResolvedValue(mockPsyWithPayment);

      await service.bookAppointment('dr-martin', {
        ...validBookingDto,
        payOnline: true,
      });

      expect(stripe.createBookingCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          psyStripeAccountId: 'acct_test_001',
          amount: 8000, // 80 EUR x 100 cents
          patientEmail: 'alice@test.fr',
          psyName: 'Dr. Martin',
        }),
      );
    });

    it('uses consultationType rate when consultationTypeId is provided', async () => {
      const { service, prisma, stripe } = createService();
      prisma.psychologist.findUnique.mockResolvedValue(mockPsyWithPayment);
      prisma.consultationType.findFirst.mockResolvedValue({
        id: 'ct-001',
        duration: 30,
        rate: 60,
      });

      await service.bookAppointment('dr-martin', {
        ...validBookingDto,
        payOnline: true,
        consultationTypeId: 'ct-001',
      });

      expect(stripe.createBookingCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 6000, // 60 EUR x 100 cents
        }),
      );

      // Also check the appointment duration comes from consultationType
      expect(prisma.appointment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            duration: 30,
            consultationTypeId: 'ct-001',
          }),
        }),
      );
    });
  });

  // ─── bookAppointment with payOnline=false ────────────────────────────────

  describe('bookAppointment with payOnline=false', () => {
    it('creates normal appointment without checkout', async () => {
      const { service, prisma, stripe } = createService();
      prisma.psychologist.findUnique.mockResolvedValue(mockPsyWithPayment);

      const result = await service.bookAppointment('dr-martin', {
        ...validBookingDto,
        payOnline: false,
      });

      expect(result).toEqual({
        success: true,
        appointmentId: 'appt-id',
      });
      expect(stripe.createBookingCheckoutSession).not.toHaveBeenCalled();
    });

    it('creates appointment with bookingPaymentStatus none', async () => {
      const { service, prisma } = createService();
      prisma.psychologist.findUnique.mockResolvedValue(mockPsyWithPayment);

      await service.bookAppointment('dr-martin', {
        ...validBookingDto,
        payOnline: false,
      });

      expect(prisma.appointment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            bookingPaymentStatus: 'none',
          }),
        }),
      );
    });
  });

  // ─── bookAppointment with payOnline=true but psy not onboarded ──────────

  describe('bookAppointment when psy not onboarded for Connect', () => {
    it('falls back to normal booking when psy has no Stripe Connect', async () => {
      const { service, prisma, stripe } = createService();
      prisma.psychologist.findUnique.mockResolvedValue(mockPsyNoPayment);

      const result = await service.bookAppointment('dr-martin', {
        ...validBookingDto,
        payOnline: true,
      });

      expect(result).toEqual({
        success: true,
        appointmentId: 'appt-id',
      });
      expect(stripe.createBookingCheckoutSession).not.toHaveBeenCalled();
    });

    it('creates appointment with bookingPaymentStatus none even if payOnline requested', async () => {
      const { service, prisma } = createService();
      prisma.psychologist.findUnique.mockResolvedValue(mockPsyNoPayment);

      await service.bookAppointment('dr-martin', {
        ...validBookingDto,
        payOnline: true,
      });

      expect(prisma.appointment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            bookingPaymentStatus: 'none',
          }),
        }),
      );
    });
  });

  // ─── bookAppointment when Stripe checkout creation fails ────────────────

  describe('bookAppointment when Stripe checkout fails', () => {
    it('falls back to normal booking on Stripe error', async () => {
      const { service, prisma, stripe } = createService();
      prisma.psychologist.findUnique.mockResolvedValue(mockPsyWithPayment);
      stripe.createBookingCheckoutSession.mockRejectedValue(new Error('Stripe API error'));

      const result = await service.bookAppointment('dr-martin', {
        ...validBookingDto,
        payOnline: true,
      });

      // Should still succeed as normal booking
      expect(result).toEqual({
        success: true,
        appointmentId: 'appt-id',
      });

      // Should reset bookingPaymentStatus to none
      expect(prisma.appointment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            bookingPaymentStatus: 'none',
          }),
        }),
      );
    });
  });

  // ─── cleanupExpiredPayments ─────────────────────────────────────────────

  describe('cleanupExpiredPayments', () => {
    it('cancels appointments with expired pending_payment status', async () => {
      const { service, prisma } = createService();
      const expiredAppt = { id: 'appt-expired-001' };
      prisma.appointment.findMany.mockResolvedValue([expiredAppt]);

      await service.cleanupExpiredPayments();

      expect(prisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            bookingPaymentStatus: 'pending_payment',
            createdAt: expect.objectContaining({ lt: expect.any(Date) }),
          }),
        }),
      );

      expect(prisma.appointment.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { in: ['appt-expired-001'] } },
          data: {
            status: 'cancelled',
            bookingPaymentStatus: 'payment_failed',
          },
        }),
      );
    });

    it('does nothing when no expired appointments exist', async () => {
      const { service, prisma } = createService();
      prisma.appointment.findMany.mockResolvedValue([]);

      await service.cleanupExpiredPayments();

      expect(prisma.appointment.updateMany).not.toHaveBeenCalled();
    });

    it('uses 35-minute threshold for expiration', async () => {
      const { service, prisma } = createService();
      prisma.appointment.findMany.mockResolvedValue([]);

      const before = new Date(Date.now() - 36 * 60 * 1000);
      await service.cleanupExpiredPayments();
      const after = new Date(Date.now() - 34 * 60 * 1000);

      const callArgs = prisma.appointment.findMany.mock.calls[0]![0] as {
        where: { createdAt: { lt: Date } };
      };
      const threshold = callArgs.where.createdAt.lt;

      expect(threshold.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(threshold.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });
});
