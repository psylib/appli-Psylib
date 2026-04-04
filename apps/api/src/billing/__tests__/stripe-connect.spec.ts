import { vi, describe, it, expect, beforeEach } from 'vitest';
import { StripeService } from '../stripe.service';

// ---------------------------------------------------------------------------
// Mock du constructeur Stripe
// ---------------------------------------------------------------------------

const mockStripe = {
  accounts: {
    create: vi.fn(),
    retrieve: vi.fn(),
  },
  accountLinks: {
    create: vi.fn(),
  },
  checkout: {
    sessions: { create: vi.fn() },
  },
  // Keep existing mocks for onModuleInit
  customers: {
    search: vi.fn(),
    create: vi.fn(),
  },
  billingPortal: {
    sessions: { create: vi.fn() },
  },
  subscriptions: { retrieve: vi.fn() },
  invoices: { list: vi.fn() },
  webhooks: { constructEvent: vi.fn() },
};

vi.mock('stripe', () => ({
  default: vi.fn(() => mockStripe),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STRIPE_KEY = 'sk_test_fake_key';

function createMockConfig() {
  return {
    getOrThrow: (key: string) => {
      if (key === 'STRIPE_SECRET_KEY') return STRIPE_KEY;
      throw new Error(`Config ${key} not found`);
    },
    get: () => undefined,
  };
}

function createService(): StripeService {
  const service = new StripeService(createMockConfig() as any);
  service.onModuleInit();
  return service;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('StripeService — Connect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // createConnectedAccount()
  // -------------------------------------------------------------------------

  describe('createConnectedAccount()', () => {
    it('creates an Express account for a French psychologist', async () => {
      const fakeAccount = { id: 'acct_test_001', type: 'express' };
      mockStripe.accounts.create.mockResolvedValue(fakeAccount);

      const service = createService();
      const result = await service.createConnectedAccount('psy@example.com', 'Dr. Dupont');

      expect(mockStripe.accounts.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'express',
          country: 'FR',
          email: 'psy@example.com',
          business_type: 'individual',
          business_profile: expect.objectContaining({
            mcc: '8049',
            name: 'Dr. Dupont',
          }),
          capabilities: expect.objectContaining({
            card_payments: { requested: true },
            transfers: { requested: true },
          }),
        }),
      );
      expect(result).toEqual(fakeAccount);
    });
  });

  // -------------------------------------------------------------------------
  // createAccountLink()
  // -------------------------------------------------------------------------

  describe('createAccountLink()', () => {
    it('creates an account onboarding link', async () => {
      mockStripe.accountLinks.create.mockResolvedValue({ url: 'https://connect.stripe.com/setup/...' });

      const service = createService();
      const result = await service.createAccountLink('acct_test_001', 'https://psylib.eu/return', 'https://psylib.eu/refresh');

      expect(mockStripe.accountLinks.create).toHaveBeenCalledWith({
        account: 'acct_test_001',
        return_url: 'https://psylib.eu/return',
        refresh_url: 'https://psylib.eu/refresh',
        type: 'account_onboarding',
      });
      expect(result).toBe('https://connect.stripe.com/setup/...');
    });
  });

  // -------------------------------------------------------------------------
  // getAccountStatus()
  // -------------------------------------------------------------------------

  describe('getAccountStatus()', () => {
    it('returns correct flags for a fully onboarded account', async () => {
      mockStripe.accounts.retrieve.mockResolvedValue({
        id: 'acct_test_001',
        charges_enabled: true,
        payouts_enabled: true,
        details_submitted: true,
      });

      const service = createService();
      const result = await service.getAccountStatus('acct_test_001');

      expect(result).toEqual({
        chargesEnabled: true,
        payoutsEnabled: true,
        detailsSubmitted: true,
      });
    });

    it('returns false flags for a partially onboarded account', async () => {
      mockStripe.accounts.retrieve.mockResolvedValue({
        id: 'acct_test_002',
        charges_enabled: false,
        payouts_enabled: false,
        details_submitted: false,
      });

      const service = createService();
      const result = await service.getAccountStatus('acct_test_002');

      expect(result).toEqual({
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
      });
    });

    it('handles undefined fields gracefully', async () => {
      mockStripe.accounts.retrieve.mockResolvedValue({ id: 'acct_test_003' });

      const service = createService();
      const result = await service.getAccountStatus('acct_test_003');

      expect(result).toEqual({
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
      });
    });
  });

  // -------------------------------------------------------------------------
  // createBookingCheckoutSession()
  // -------------------------------------------------------------------------

  describe('createBookingCheckoutSession()', () => {
    const baseParams = {
      psyStripeAccountId: 'acct_test_001',
      amount: 7000, // 70 EUR in cents
      patientEmail: 'patient@example.com',
      psyName: 'Dr. Dupont',
      appointmentId: 'apt-001',
      motif: 'Consultation initiale',
      successUrl: 'https://psylib.eu/success',
      cancelUrl: 'https://psylib.eu/cancel',
    };

    it('creates a payment checkout session with transfer_data', async () => {
      const fakeSession = { id: 'cs_test_001', url: 'https://checkout.stripe.com/pay/...' };
      mockStripe.checkout.sessions.create.mockResolvedValue(fakeSession);

      const service = createService();
      const result = await service.createBookingCheckoutSession(baseParams);

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'payment',
          customer_email: 'patient@example.com',
          payment_intent_data: expect.objectContaining({
            transfer_data: {
              destination: 'acct_test_001',
            },
            metadata: {
              appointment_id: 'apt-001',
            },
          }),
          metadata: expect.objectContaining({
            appointment_id: 'apt-001',
            type: 'booking_payment',
          }),
        }),
      );
      expect(result).toEqual(fakeSession);
    });

    it('sets the correct amount in line_items', async () => {
      mockStripe.checkout.sessions.create.mockResolvedValue({ id: 'cs_test_002' });

      const service = createService();
      await service.createBookingCheckoutSession(baseParams);

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            expect.objectContaining({
              price_data: expect.objectContaining({
                currency: 'eur',
                unit_amount: 7000,
                product_data: expect.objectContaining({
                  name: 'Consultation initiale',
                }),
              }),
              quantity: 1,
            }),
          ],
        }),
      );
    });

    it('sets expires_at approximately 35 minutes from now', async () => {
      mockStripe.checkout.sessions.create.mockResolvedValue({ id: 'cs_test_003' });

      const before = Math.floor(Date.now() / 1000) + 34 * 60;
      const service = createService();
      await service.createBookingCheckoutSession(baseParams);
      const after = Math.floor(Date.now() / 1000) + 36 * 60;

      const callArgs = mockStripe.checkout.sessions.create.mock.calls[0]![0];
      expect(callArgs.expires_at).toBeGreaterThanOrEqual(before);
      expect(callArgs.expires_at).toBeLessThanOrEqual(after);
    });
  });
});
