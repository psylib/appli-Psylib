import { Page, Route } from '@playwright/test';

const API_BASE = 'https://api.psylib.eu/api/v1';

/**
 * Mock API responses for authenticated E2E tests.
 * Intercepts fetch calls to the NestJS API and returns fixture data.
 */
export function mockApi(page: Page, method: string, path: string, body: unknown, status = 200) {
  return page.route(`**${API_BASE}${path}*`, (route: Route) => {
    if (route.request().method() === method) {
      return route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    }
    return route.continue();
  });
}

/**
 * Inject a fake next-auth session cookie to simulate an authenticated user.
 * This bypasses Keycloak OIDC for E2E tests.
 */
export async function loginAsPsychologist(page: Page) {
  // Mock the next-auth session endpoint
  await page.route('**/api/auth/session', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          id: 'psy-001',
          name: 'Dr. Test Dupont',
          email: 'test@psylib.eu',
          role: 'psychologist',
        },
        accessToken: 'fake-jwt-token-for-e2e',
        role: 'psychologist',
        expires: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      }),
    }),
  );
}

/**
 * Same as loginAsPsychologist but marks the user as NOT onboarded.
 * Use for onboarding wizard tests.
 */
export async function loginAsPsychologistNotOnboarded(page: Page) {
  await page.route('**/api/auth/session', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          id: 'psy-new-001',
          name: 'Dr. Nouveau',
          email: 'new@psylib.eu',
          role: 'psychologist',
        },
        accessToken: 'fake-jwt-token-for-e2e',
        role: 'psychologist',
        isOnboarded: false,
        expires: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      }),
    }),
  );
}

/**
 * Mock a Server-Sent Events (SSE) stream for a given URL.
 * Concatenates chunks into a single response body with proper `data: ` prefix.
 */
export async function mockSseStream(page: Page, urlPattern: string, chunks: string[]) {
  const body = chunks.map((c) => `data: ${c}\n\n`).join('') + 'data: [DONE]\n\n';
  await page.route(urlPattern, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      headers: {
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
      body,
    }),
  );
}

export async function loginAsPatient(page: Page) {
  await page.route('**/api/auth/session', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          id: 'patient-001',
          name: 'Marie Patient',
          email: 'marie@example.com',
          role: 'patient',
        },
        accessToken: 'fake-patient-jwt-for-e2e',
        role: 'patient',
        patientId: 'patient-001',
        expires: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      }),
    }),
  );
}

// --- Fixtures ---

export const fixtures = {
  dashboard: {
    activePatients: 24,
    activePatientsLastMonth: 20,
    sessionsThisMonth: 38,
    sessionsLastMonth: 32,
    revenueThisMonth: 3040,
    revenueLastMonth: 2560,
    appointmentsToday: 3,
  },

  checklist: {
    profileCompleted: true,
    firstPatient: true,
    firstSession: true,
    billingSetup: false,
  },

  patients: {
    data: [
      { id: 'p1', name: 'Marie Dupont', email: 'marie@example.com', phone: '+33612345678', status: 'active', createdAt: '2024-06-15T10:00:00Z' },
      { id: 'p2', name: 'Jean Martin', email: 'jean@example.com', phone: '+33698765432', status: 'active', createdAt: '2024-08-20T14:30:00Z' },
      { id: 'p3', name: 'Sophie Laurent', email: 'sophie@example.com', phone: null, status: 'inactive', createdAt: '2024-03-10T09:00:00Z' },
    ],
    total: 3,
    page: 1,
    totalPages: 1,
  },

  sessions: {
    data: [
      { id: 's1', date: '2026-03-22T14:00:00Z', duration: 50, type: 'individual', notes: 'Patient a parlé de son anxiété.', tags: ['anxiété', 'sommeil'], rate: 80, paymentStatus: 'paid', patient: { id: 'p1', name: 'Marie Dupont' } },
      { id: 's2', date: '2026-03-21T10:00:00Z', duration: 45, type: 'online', notes: '', tags: [], rate: 70, paymentStatus: 'pending', patient: { id: 'p2', name: 'Jean Martin' } },
    ],
    total: 2,
    page: 1,
    totalPages: 1,
  },

  session: {
    id: 's1',
    date: '2026-03-22T14:00:00Z',
    duration: 50,
    type: 'individual',
    notes: 'Patient a parlé de son anxiété au travail.',
    summaryAi: null,
    tags: ['anxiété', 'sommeil'],
    rate: 80,
    paymentStatus: 'paid',
    patient: { id: 'p1', name: 'Marie Dupont', email: 'marie@example.com' },
  },

  appointments: {
    data: [
      { id: 'a1', scheduledAt: '2026-03-25T15:00:00Z', duration: 50, status: 'scheduled', patient: { id: 'p1', name: 'Marie Dupont', email: 'marie@example.com' } },
      { id: 'a2', scheduledAt: '2026-03-25T16:00:00Z', duration: 45, status: 'confirmed', patient: { id: 'p2', name: 'Jean Martin', email: 'jean@example.com' } },
    ],
    total: 2,
  },

  psychologist: {
    id: 'psy-001',
    name: 'Dr. Test Dupont',
    slug: 'dr-test-dupont',
    specialization: 'Psychologie clinique',
    bio: 'Spécialisé en TCC',
    phone: '+33600000000',
    address: '10 rue de la Paix, 75002 Paris',
    adeliNumber: '759312345',
    isOnboarded: true,
  },

  patientDashboard: {
    avgMood7d: 6.5,
    moodHistory: [
      { mood: 7, createdAt: '2026-03-22T20:00:00Z' },
      { mood: 5, createdAt: '2026-03-21T19:30:00Z' },
      { mood: 8, createdAt: '2026-03-20T21:00:00Z' },
      { mood: 6, createdAt: '2026-03-19T18:00:00Z' },
    ],
    pendingExercises: [
      { id: 'ex1', title: 'Respiration 4-7-8', status: 'assigned' },
    ],
    nextAppointment: { scheduledAt: '2026-03-25T15:00:00Z', duration: 50, status: 'scheduled' },
    journalCount: 12,
  },

  moodHistory: [
    { id: 'm1', mood: 7, note: 'Bonne journée', createdAt: '2026-03-22T20:00:00Z' },
    { id: 'm2', mood: 5, note: null, createdAt: '2026-03-21T19:30:00Z' },
    { id: 'm3', mood: 8, note: 'Très motivé', createdAt: '2026-03-20T21:00:00Z' },
  ],

  onboarding: {
    profile: {
      name: 'Dr. Nouveau',
      specialization: 'Psychologue clinicien',
      adeliNumber: '75931234567',
      bio: 'Approche intégrative TCC.',
    },
    practice: {
      address: '12 rue de la Paix, 75001 Paris',
      phone: '+33123456789',
    },
    preferences: {
      sessionDuration: 50,
      sessionRate: 80,
    },
  },

  publicPsyProfile: {
    id: 'psy-001',
    name: 'Dr. Test Dupont',
    slug: 'dr-test-dupont',
    specialization: 'Psychologue clinicien',
    bio: 'Spécialisé en TCC',
    phone: '+33600000000',
    address: '10 rue de la Paix, 75002 Paris',
    city: 'Paris',
    adeliNumber: '759312345',
    avatarUrl: null,
    defaultSessionDuration: 50,
    defaultSessionRate: 80,
    approaches: ['TCC'],
    specialties: ['Anxiété', 'Dépression'],
    acceptsMonSoutienPsy: false,
    offersVisio: true,
    acceptsOnlinePayment: true,
    consultationTypes: [
      {
        id: 'ct1',
        name: 'Première consultation',
        duration: 60,
        rate: 80,
        color: '#3D52A0',
        description: 'Séance de découverte',
      },
    ],
  },

  publicBookingSlots: {
    slots: [
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
      new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    ],
  },

  sessionWithNotes: {
    id: 's1',
    date: '2026-03-22T14:00:00Z',
    duration: 50,
    type: 'individual' as const,
    notes: 'Le patient a exprimé une anxiété croissante liée à son travail. Il décrit des nuits agitées et des ruminations fréquentes. Nous avons exploré des techniques de respiration et discuté de l exposition progressive.',
    summaryAi: null,
    tags: [],
    rate: 80,
    paymentStatus: 'paid' as const,
    patient: { id: 'p1', name: 'Marie Dupont', email: 'marie@example.com' },
  },

  invoices: [
    {
      id: 'inv1',
      invoiceNumber: 'PSY-2026-0001',
      amountTtc: '80.00',
      status: 'draft' as const,
      issuedAt: '2026-03-15T00:00:00Z',
      pdfUrl: null,
      source: 'manual' as const,
      paidAt: null,
      sessionId: null,
      patient: { id: 'p1', name: 'Marie Dupont', email: 'marie@example.com' },
    },
    {
      id: 'inv2',
      invoiceNumber: 'PSY-2026-0002',
      amountTtc: '70.00',
      status: 'paid' as const,
      issuedAt: '2026-03-18T00:00:00Z',
      pdfUrl: null,
      source: 'auto' as const,
      paidAt: '2026-03-18T10:30:00Z',
      sessionId: 's2',
      patient: { id: 'p2', name: 'Jean Martin', email: 'jean@example.com' },
    },
  ],
};
