import { vi } from 'vitest';
import { StripeService } from '../stripe.service';

// ---------------------------------------------------------------------------
// Mock du constructeur Stripe (doit être AVANT les imports du service)
// ---------------------------------------------------------------------------

const mockStripe = {
  customers: {
    search: vi.fn(),
    create: vi.fn(),
  },
  checkout: {
    sessions: { create: vi.fn() },
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
const PSY_ID = 'psy-001';
const CUSTOMER_ID = 'cus_test_001';
const PRICE_ID = 'price_starter_001';

function createMockConfig(key: string | undefined) {
  return {
    getOrThrow: (configKey: string) => {
      if (configKey === 'STRIPE_SECRET_KEY') {
        if (key === undefined) throw new Error('Config STRIPE_SECRET_KEY not found');
        return key;
      }
      throw new Error(`Config ${configKey} not found`);
    },
    get: (configKey: string) => {
      if (configKey === 'STRIPE_SECRET_KEY') return key;
      return undefined;
    },
  };
}

function createService(stripeKey: string | undefined = STRIPE_KEY): StripeService {
  const service = new StripeService(createMockConfig(stripeKey) as any);
  if (stripeKey !== undefined) {
    service.onModuleInit();
  }
  return service;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('StripeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // onModuleInit()
  // -------------------------------------------------------------------------

  describe('onModuleInit()', () => {
    it('initialise le SDK Stripe avec la clé secrète', async () => {
      const Stripe = (await import('stripe')).default;
      vi.clearAllMocks();

      const service = new StripeService(createMockConfig(STRIPE_KEY) as any);
      service.onModuleInit();

      expect(Stripe).toHaveBeenCalledWith(
        STRIPE_KEY,
        expect.objectContaining({ typescript: true }),
      );
    });

    it('lève une erreur si STRIPE_SECRET_KEY est absent', () => {
      const service = new StripeService(createMockConfig(undefined) as any);

      expect(() => service.onModuleInit()).toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // createOrRetrieveCustomer()
  // -------------------------------------------------------------------------

  describe('createOrRetrieveCustomer()', () => {
    it('retourne le customer existant si trouvé par metadata psychologist_id', async () => {
      const existingCustomer = { id: CUSTOMER_ID, email: 'psy@example.com' };
      mockStripe.customers.search.mockResolvedValue({ data: [existingCustomer] });

      const service = createService();
      const result = await service.createOrRetrieveCustomer(
        'psy@example.com',
        'Dr. Dupont',
        PSY_ID,
      );

      expect(mockStripe.customers.search).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.stringContaining(PSY_ID),
          limit: 1,
        }),
      );
      expect(mockStripe.customers.create).not.toHaveBeenCalled();
      expect(result).toEqual(existingCustomer);
    });

    it('crée un nouveau customer si aucun n\'est trouvé', async () => {
      const newCustomer = { id: 'cus_new_001', email: 'nouveau@example.com' };
      mockStripe.customers.search.mockResolvedValue({ data: [] });
      mockStripe.customers.create.mockResolvedValue(newCustomer);

      const service = createService();
      const result = await service.createOrRetrieveCustomer(
        'nouveau@example.com',
        'Dr. Martin',
        PSY_ID,
      );

      expect(mockStripe.customers.create).toHaveBeenCalledOnce();
      expect(result).toEqual(newCustomer);
    });

    it('inclut le psychologistId dans les metadata lors de la création', async () => {
      mockStripe.customers.search.mockResolvedValue({ data: [] });
      mockStripe.customers.create.mockResolvedValue({ id: 'cus_new_002' });

      const service = createService();
      await service.createOrRetrieveCustomer('psy@example.com', 'Dr. Test', PSY_ID);

      expect(mockStripe.customers.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: { psychologist_id: PSY_ID },
        }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // createCheckoutSession()
  // -------------------------------------------------------------------------

  describe('createCheckoutSession()', () => {
    const baseParams = {
      customerId: CUSTOMER_ID,
      priceId: PRICE_ID,
      successUrl: 'https://psylib.eu/billing/success',
      cancelUrl: 'https://psylib.eu/billing/cancel',
      psychologistId: PSY_ID,
    };

    it('crée une session Stripe en mode subscription', async () => {
      const fakeCheckoutSession = { id: 'cs_test_001', url: 'https://checkout.stripe.com/...' };
      mockStripe.checkout.sessions.create.mockResolvedValue(fakeCheckoutSession);

      const service = createService();
      const result = await service.createCheckoutSession(baseParams);

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'subscription',
          customer: CUSTOMER_ID,
        }),
      );
      expect(result).toEqual(fakeCheckoutSession);
    });

    it('inclut les trial days si fournis', async () => {
      mockStripe.checkout.sessions.create.mockResolvedValue({ id: 'cs_trial_001' });

      const service = createService();
      await service.createCheckoutSession({ ...baseParams, trialDays: 14 });

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          subscription_data: expect.objectContaining({
            trial_period_days: 14,
          }),
        }),
      );
    });

    it('inclut le customerId et priceId dans la session', async () => {
      mockStripe.checkout.sessions.create.mockResolvedValue({ id: 'cs_test_002' });

      const service = createService();
      await service.createCheckoutSession(baseParams);

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: CUSTOMER_ID,
          line_items: [{ price: PRICE_ID, quantity: 1 }],
        }),
      );
    });

    it('inclut le psychologistId dans les metadata de l\'abonnement', async () => {
      mockStripe.checkout.sessions.create.mockResolvedValue({ id: 'cs_test_003' });

      const service = createService();
      await service.createCheckoutSession(baseParams);

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          subscription_data: expect.objectContaining({
            metadata: { psychologist_id: PSY_ID },
          }),
        }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // constructWebhookEvent()
  // -------------------------------------------------------------------------

  describe('constructWebhookEvent()', () => {
    it('valide et retourne l\'event si la signature est correcte', () => {
      const fakeEvent = { id: 'evt_001', type: 'checkout.session.completed' };
      mockStripe.webhooks.constructEvent.mockReturnValue(fakeEvent);

      const service = createService();
      const payload = Buffer.from('{}');
      const result = service.constructWebhookEvent(payload, 'valid_sig', 'whsec_secret');

      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        payload,
        'valid_sig',
        'whsec_secret',
      );
      expect(result).toEqual(fakeEvent);
    });

    it('propage l\'erreur Stripe si la signature est invalide', () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('No signatures found matching the expected signature for payload.');
      });

      const service = createService();
      const payload = Buffer.from('{}');

      expect(() =>
        service.constructWebhookEvent(payload, 'invalid_sig', 'whsec_secret'),
      ).toThrow('No signatures found matching the expected signature for payload.');
    });
  });
});
