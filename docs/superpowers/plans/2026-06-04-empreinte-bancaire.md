# Empreinte bancaire (carte enregistrée) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre au psy de demander l'enregistrement de la carte d'un patient à la réservation, puis d'encaisser librement (ou de libérer) à la fin de la séance ou en cas d'absence.

**Architecture :** Carte enregistrée via Stripe Checkout `mode:'setup'` (SetupIntent) sur un Customer plateforme, débitée plus tard en off-session via destination charge vers le compte Connect du psy. Aucune limite de durée (contrairement à une pré-autorisation 7 jours). Webhook `checkout.session.completed` (mode setup) finalise l'enregistrement. Trois nouveaux endpoints psy : capture, release, setup-link (flux B).

**Tech Stack :** NestJS, Prisma/PostgreSQL, Stripe Connect (destination charges), BullMQ webhooks, Next.js App Router, React Query, react-hook-form + Zod.

**Spec de référence :** `docs/superpowers/specs/2026-06-04-empreinte-bancaire-design.md`

---

## File Structure

**Backend (NestJS)**
- `apps/api/prisma/schema.prisma` — enum `CardHoldStatus`, valeur `imprint` sur `AppointmentPaymentMode`, champs sur `Appointment` + `ConsultationType`.
- `apps/api/prisma/migrations/20260604_card_imprint/migration.sql` — migration idempotente.
- `apps/api/src/billing/stripe.service.ts` — `createSetupCheckoutSession`, `captureImprint`, `createImprintCustomer`.
- `apps/api/src/billing/subscription.service.ts` — `captureImprint`, `releaseImprint`, `createImprintSetupLink`, `handleImprintSetupCompleted` + dispatch webhook.
- `apps/api/src/billing/dto/capture-imprint.dto.ts` — DTO Zod montant.
- `apps/api/src/billing/billing.controller.ts` — 3 endpoints.
- `apps/api/src/public-booking/public-booking.service.ts` — branche imprint à la réservation publique.
- `apps/api/src/notifications/email.service.ts` — 3 emails (`sendImprintRequestToPatient`, `sendImprintSecuredToPsy`, `sendImprintReceiptToPatient`).

**Shared**
- `packages/shared-types/src/*` — type `CardHoldStatus`.

**Frontend (Next.js)**
- `apps/web/src/lib/api/billing.ts` — `captureImprint`, `releaseImprint`, `createImprintSetupLink`.
- `apps/web/src/components/billing/payment-actions.tsx` — boutons Encaisser / Libérer + dialog montant.
- `apps/web/src/components/sessions/smart-slot-picker-dialog.tsx` — case « Demander une empreinte ».
- `apps/web/src/components/booking/payment-choice.tsx` (ou `consultation-type-picker.tsx`) — encart consentement empreinte.
- `apps/web/src/app/psy/[slug]/public-profile-client.tsx` — redirection vers le Checkout setup.
- Settings type de consultation — toggle `requireImprint` (fichier du formulaire de type de consultation).

---

## Task 1: Schéma Prisma + migration + shared-types

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/20260604_card_imprint/migration.sql`
- Modify: `packages/shared-types/src/` (fichier d'enums)

- [ ] **Step 1: Ajouter l'enum et les champs au schéma Prisma**

Dans `apps/api/prisma/schema.prisma`, ajouter le nouvel enum près des autres enums Appointment :

```prisma
enum CardHoldStatus {
  none
  pending
  secured
  captured
  released
  failed

  @@map("card_hold_status")
}
```

Ajouter la valeur `imprint` à l'enum `AppointmentPaymentMode` :

```prisma
enum AppointmentPaymentMode {
  none
  online
  on_site
  imprint
}
```

Sur `model ConsultationType` (après `cancellationDelay`) :

```prisma
  requireImprint      Boolean              @default(false) @map("require_imprint")
```

Sur `model Appointment` (après `bookingPaymentStatus`) :

```prisma
  stripeCustomerId      String?         @map("stripe_customer_id")
  stripePaymentMethodId String?         @map("stripe_payment_method_id")
  cardHoldStatus        CardHoldStatus  @default(none) @map("card_hold_status")
```

- [ ] **Step 2: Générer le client Prisma et vérifier la compilation du schéma**

Run: `cd apps/api && npx prisma generate`
Expected: `Generated Prisma Client` sans erreur de validation de schéma.

- [ ] **Step 3: Écrire la migration SQL idempotente**

Créer `apps/api/prisma/migrations/20260604_card_imprint/migration.sql` :

```sql
-- CardHoldStatus enum
DO $$ BEGIN
  CREATE TYPE "card_hold_status" AS ENUM ('none', 'pending', 'secured', 'captured', 'released', 'failed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- New value on AppointmentPaymentMode
ALTER TYPE "AppointmentPaymentMode" ADD VALUE IF NOT EXISTS 'imprint';

-- ConsultationType.require_imprint
ALTER TABLE "consultation_types" ADD COLUMN IF NOT EXISTS "require_imprint" BOOLEAN NOT NULL DEFAULT false;

-- Appointment imprint columns
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "stripe_customer_id" TEXT;
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "stripe_payment_method_id" TEXT;
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "card_hold_status" "card_hold_status" NOT NULL DEFAULT 'none';
```

> Note : la colonne `card_hold_status` référence le type enum mappé `"card_hold_status"`. Le `default(none)` côté Prisma correspond au défaut SQL `'none'`.

- [ ] **Step 4: Appliquer la migration en local et vérifier**

Run: `cd apps/api && npx prisma migrate deploy`
Expected: `Applied migration 20260604_card_imprint` (ou « No pending migrations » si déjà appliquée — idempotent).

- [ ] **Step 5: Ajouter le type `CardHoldStatus` aux shared-types**

Dans le fichier d'enums de `packages/shared-types/src/` (chercher où `AppointmentPaymentMode` ou les statuts sont déclarés), ajouter :

```typescript
export type CardHoldStatus =
  | 'none'
  | 'pending'
  | 'secured'
  | 'captured'
  | 'released'
  | 'failed';
```

Si `AppointmentPaymentMode` y est défini comme union, ajouter `'imprint'`. Puis rebuild :

Run: `cd packages/shared-types && npm run build`
Expected: build OK, `dist/index.js` régénéré.

- [ ] **Step 6: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations/20260604_card_imprint packages/shared-types
git commit -m "feat(db): schema empreinte bancaire (CardHoldStatus, require_imprint)"
```

---

## Task 2: StripeService — Checkout setup + Customer empreinte

**Files:**
- Modify: `apps/api/src/billing/stripe.service.ts`
- Test: `apps/api/src/billing/__tests__/stripe.service.spec.ts`

- [ ] **Step 1: Écrire les tests qui échouent**

Dans `apps/api/src/billing/__tests__/stripe.service.spec.ts`, repérer la structure des mocks existants (le mock Stripe expose `checkout.sessions.create`, `customers.create`, etc.). Ajouter :

```typescript
describe('createImprintCustomer', () => {
  it('crée un customer plateforme avec metadata patient + appointment', async () => {
    const created = { id: 'cus_imp1' };
    (stripeMock.customers.create as jest.Mock).mockResolvedValue(created);

    const result = await service.createImprintCustomer({
      email: 'p@test.fr',
      name: 'Patient Test',
      psychologistId: 'psy1',
      patientId: 'pat1',
      appointmentId: 'apt1',
    });

    expect(stripeMock.customers.create).toHaveBeenCalledWith({
      email: 'p@test.fr',
      name: 'Patient Test',
      metadata: { psychologist_id: 'psy1', patient_id: 'pat1', appointment_id: 'apt1' },
    });
    expect(result.id).toBe('cus_imp1');
  });
});

describe('createSetupCheckoutSession', () => {
  it('crée une session Checkout mode setup avec metadata card_imprint_setup', async () => {
    const session = { id: 'cs_setup1', url: 'https://stripe/setup' };
    (stripeMock.checkout.sessions.create as jest.Mock).mockResolvedValue(session);

    const result = await service.createSetupCheckoutSession({
      customerId: 'cus_imp1',
      appointmentId: 'apt1',
      successUrl: 'https://app/success',
      cancelUrl: 'https://app/cancel',
    });

    expect(stripeMock.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'setup',
        customer: 'cus_imp1',
        payment_method_types: ['card'],
        metadata: { type: 'card_imprint_setup', appointmentId: 'apt1' },
        setup_intent_data: { metadata: { appointmentId: 'apt1' } },
        success_url: 'https://app/success',
        cancel_url: 'https://app/cancel',
      }),
    );
    expect(result.url).toBe('https://stripe/setup');
  });
});
```

- [ ] **Step 2: Lancer les tests pour vérifier l'échec**

Run: `cd apps/api && npx jest stripe.service.spec --no-coverage -t "Imprint|setup"`
Expected: FAIL — `service.createImprintCustomer is not a function`.

- [ ] **Step 3: Implémenter les méthodes**

Dans `apps/api/src/billing/stripe.service.ts`, ajouter :

```typescript
async createImprintCustomer(params: {
  email: string;
  name: string;
  psychologistId: string;
  patientId: string;
  appointmentId: string;
}): Promise<Stripe.Customer> {
  return this.stripe.customers.create({
    email: params.email,
    name: params.name,
    metadata: {
      psychologist_id: params.psychologistId,
      patient_id: params.patientId,
      appointment_id: params.appointmentId,
    },
  });
}

/**
 * Checkout en mode 'setup' : enregistre la carte du patient (SCA) sans débit.
 * usage off_session => carte réutilisable plus tard par le psy.
 */
async createSetupCheckoutSession(params: {
  customerId: string;
  appointmentId: string;
  successUrl: string;
  cancelUrl: string;
  expiresInSeconds?: number;
}): Promise<Stripe.Checkout.Session> {
  const create: Stripe.Checkout.SessionCreateParams = {
    mode: 'setup',
    customer: params.customerId,
    payment_method_types: ['card'],
    setup_intent_data: { metadata: { appointmentId: params.appointmentId } },
    metadata: { type: 'card_imprint_setup', appointmentId: params.appointmentId },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  };
  if (params.expiresInSeconds) {
    create.expires_at = Math.floor(Date.now() / 1000) + params.expiresInSeconds;
  }
  return this.stripe.checkout.sessions.create(create);
}
```

- [ ] **Step 4: Lancer les tests pour vérifier le succès**

Run: `cd apps/api && npx jest stripe.service.spec --no-coverage -t "Imprint|setup"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/billing/stripe.service.ts apps/api/src/billing/__tests__/stripe.service.spec.ts
git commit -m "feat(stripe): checkout setup + customer empreinte"
```

---

## Task 3: StripeService — capture off-session

**Files:**
- Modify: `apps/api/src/billing/stripe.service.ts`
- Test: `apps/api/src/billing/__tests__/stripe.service.spec.ts`

- [ ] **Step 1: Écrire les tests qui échouent**

```typescript
describe('captureImprint', () => {
  it('crée un PaymentIntent off-session confirmé en destination charge', async () => {
    const pi = { id: 'pi_1', status: 'succeeded' };
    (stripeMock.paymentIntents.create as jest.Mock).mockResolvedValue(pi);

    const result = await service.captureImprint({
      customerId: 'cus_imp1',
      paymentMethodId: 'pm_1',
      connectedAccountId: 'acct_1',
      amount: 60,
      appointmentId: 'apt1',
    });

    expect(stripeMock.paymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 6000,
        currency: 'eur',
        customer: 'cus_imp1',
        payment_method: 'pm_1',
        off_session: true,
        confirm: true,
        transfer_data: { destination: 'acct_1' },
        metadata: { type: 'card_imprint_capture', appointmentId: 'apt1' },
      }),
    );
    expect(result.status).toBe('succeeded');
    expect(result.id).toBe('pi_1');
  });

  it('renvoie requiresAction=true quand la carte exige une authentification', async () => {
    const err: any = new Error('authentication required');
    err.code = 'authentication_required';
    (stripeMock.paymentIntents.create as jest.Mock).mockRejectedValue(err);

    const result = await service.captureImprint({
      customerId: 'cus_imp1',
      paymentMethodId: 'pm_1',
      connectedAccountId: 'acct_1',
      amount: 60,
      appointmentId: 'apt1',
    });

    expect(result.requiresAction).toBe(true);
    expect(result.status).toBe('requires_action');
  });
});
```

- [ ] **Step 2: Lancer les tests pour vérifier l'échec**

Run: `cd apps/api && npx jest stripe.service.spec --no-coverage -t "captureImprint"`
Expected: FAIL — `service.captureImprint is not a function`.

- [ ] **Step 3: Implémenter `captureImprint`**

```typescript
/**
 * Débite la carte enregistrée off-session vers le compte connecté du psy.
 * Renvoie requiresAction=true si la carte exige une ré-authentification SCA
 * (au lieu de throw), pour permettre le fallback lien de paiement.
 */
async captureImprint(params: {
  customerId: string;
  paymentMethodId: string;
  connectedAccountId: string;
  amount: number; // euros
  appointmentId: string;
}): Promise<{ id: string | null; status: string; requiresAction: boolean }> {
  try {
    const pi = await this.stripe.paymentIntents.create({
      amount: Math.round(params.amount * 100),
      currency: 'eur',
      customer: params.customerId,
      payment_method: params.paymentMethodId,
      off_session: true,
      confirm: true,
      transfer_data: { destination: params.connectedAccountId },
      metadata: { type: 'card_imprint_capture', appointmentId: params.appointmentId },
    });
    return { id: pi.id, status: pi.status, requiresAction: false };
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === 'authentication_required') {
      return { id: null, status: 'requires_action', requiresAction: true };
    }
    throw err;
  }
}
```

- [ ] **Step 4: Lancer les tests pour vérifier le succès**

Run: `cd apps/api && npx jest stripe.service.spec --no-coverage -t "captureImprint"`
Expected: PASS (les deux cas).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/billing/stripe.service.ts apps/api/src/billing/__tests__/stripe.service.spec.ts
git commit -m "feat(stripe): capture empreinte off-session + fallback SCA"
```

---

## Task 4: Webhook — finalisation de l'enregistrement de carte

**Files:**
- Modify: `apps/api/src/billing/subscription.service.ts`
- Test: `apps/api/src/billing/__tests__/subscription.service.spec.ts`

- [ ] **Step 1: Écrire le test qui échoue**

Dans `apps/api/src/billing/__tests__/subscription.service.spec.ts`, ajouter (adapter aux noms de mocks Prisma/Stripe existants dans ce fichier) :

```typescript
describe('handleImprintSetupCompleted', () => {
  it('enregistre customer + payment method et passe à secured', async () => {
    const session: any = {
      id: 'cs_setup1',
      mode: 'setup',
      customer: 'cus_imp1',
      setup_intent: 'seti_1',
      metadata: { type: 'card_imprint_setup', appointmentId: 'apt1' },
    };
    (stripeMock.retrieveSetupIntent as jest.Mock).mockResolvedValue({
      id: 'seti_1',
      payment_method: 'pm_1',
    });
    prismaMock.appointment.update.mockResolvedValue({ id: 'apt1' });
    prismaMock.appointment.findUnique.mockResolvedValue({
      id: 'apt1',
      psychologistId: 'psy1',
      psychologist: { name: 'Dr X', user: { email: 'psy@test.fr' } },
      patient: { name: 'Patient', email: 'p@test.fr' },
    });

    await service.handleImprintSetupCompleted(session);

    expect(prismaMock.appointment.update).toHaveBeenCalledWith({
      where: { id: 'apt1' },
      data: {
        stripeCustomerId: 'cus_imp1',
        stripePaymentMethodId: 'pm_1',
        cardHoldStatus: 'secured',
        paymentMode: 'imprint',
      },
    });
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier l'échec**

Run: `cd apps/api && npx jest subscription.service.spec --no-coverage -t "handleImprintSetupCompleted"`
Expected: FAIL — méthode inexistante.

- [ ] **Step 3: Ajouter `retrieveSetupIntent` au StripeService**

Dans `apps/api/src/billing/stripe.service.ts` :

```typescript
async retrieveSetupIntent(id: string): Promise<Stripe.SetupIntent> {
  return this.stripe.setupIntents.retrieve(id);
}
```

- [ ] **Step 4: Brancher le dispatch webhook + implémenter le handler**

Dans `apps/api/src/billing/subscription.service.ts`, méthode `handleCheckoutCompleted`, ajouter en tête (avant le bloc `booking_payment`) :

```typescript
    // Card imprint setup (mode: 'setup')
    if (session.metadata?.['type'] === 'card_imprint_setup') {
      await this.handleImprintSetupCompleted(session);
      return;
    }
```

Puis ajouter la méthode (à côté de `handlePaymentLinkCompleted`) :

```typescript
async handleImprintSetupCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const appointmentId = session.metadata?.['appointmentId'];
  if (!appointmentId) {
    this.logger.warn('card_imprint_setup: missing appointmentId');
    return;
  }
  const setupIntentId = session.setup_intent as string | null;
  if (!setupIntentId) {
    this.logger.warn(`card_imprint_setup: missing setup_intent for ${appointmentId}`);
    return;
  }

  const setupIntent = await this.stripe.retrieveSetupIntent(setupIntentId);
  const paymentMethodId = setupIntent.payment_method as string | null;
  if (!paymentMethodId) {
    this.logger.warn(`card_imprint_setup: no payment_method for ${appointmentId}`);
    return;
  }

  await this.prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      stripeCustomerId: session.customer as string,
      stripePaymentMethodId: paymentMethodId,
      cardHoldStatus: 'secured',
      paymentMode: 'imprint',
    },
  });

  const appointment = await this.prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      psychologist: { select: { name: true, user: { select: { email: true } } } },
      patient: { select: { name: true } },
    },
  });

  if (appointment?.psychologist.user.email) {
    void this.email
      .sendImprintSecuredToPsy(appointment.psychologist.user.email, {
        psychologistName: appointment.psychologist.name,
        patientName: appointment.patient?.name ?? 'Patient',
      })
      .catch((err) => this.logger.warn(`Email send failed: ${(err as Error).message}`));
  }

  this.logger.log(`Card imprint secured for appointment ${appointmentId}`);
}
```

- [ ] **Step 5: Ajouter l'email `sendImprintSecuredToPsy`**

Dans `apps/api/src/notifications/email.service.ts`, en suivant le pattern de `sendPaymentReceivedToPsy` :

```typescript
async sendImprintSecuredToPsy(
  to: string,
  data: { psychologistName: string; patientName: string },
): Promise<void> {
  await this.send({
    to,
    subject: 'Empreinte bancaire enregistrée',
    html: `<p>Bonjour ${data.psychologistName},</p>
      <p>${data.patientName} a enregistré sa carte pour garantir son rendez-vous.
      Vous pourrez encaisser le montant de votre choix à la fin de la séance,
      ou en cas d'absence, depuis votre agenda.</p>`,
  });
}
```

> Vérifier la signature exacte de la méthode privée `send(...)` (ligne ~72) et adapter (objet `{ to, subject, html }` ou paramètres positionnels).

- [ ] **Step 6: Lancer les tests pour vérifier le succès**

Run: `cd apps/api && npx jest subscription.service.spec --no-coverage -t "handleImprintSetupCompleted"`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/billing/subscription.service.ts apps/api/src/billing/stripe.service.ts apps/api/src/notifications/email.service.ts
git commit -m "feat(billing): webhook finalisation empreinte (carte secured)"
```

---

## Task 5: Capture + Release — service, DTO, endpoints

**Files:**
- Create: `apps/api/src/billing/dto/capture-imprint.dto.ts`
- Modify: `apps/api/src/billing/subscription.service.ts`
- Modify: `apps/api/src/billing/billing.controller.ts`
- Modify: `apps/api/src/notifications/email.service.ts`
- Test: `apps/api/src/billing/__tests__/subscription.service.spec.ts`

- [ ] **Step 1: Créer le DTO Zod**

`apps/api/src/billing/dto/capture-imprint.dto.ts` (pattern identique à `refund.dto.ts`) :

```typescript
import { z } from 'zod';

export const CaptureImprintSchema = z.object({
  amount: z.number().positive().max(10000),
});

export type CaptureImprintDto = z.infer<typeof CaptureImprintSchema>;
```

- [ ] **Step 2: Écrire les tests qui échouent**

Dans `subscription.service.spec.ts` :

```typescript
describe('captureImprint', () => {
  const psy = {
    id: 'psy1', stripeAccountId: 'acct_1', stripeOnboardingComplete: true,
    name: 'Dr X',
  };
  const appointment = {
    id: 'apt1', psychologistId: 'psy1', patientId: 'pat1',
    cardHoldStatus: 'secured', stripeCustomerId: 'cus_1', stripePaymentMethodId: 'pm_1',
    patient: { id: 'pat1', name: 'Patient', email: 'p@test.fr' },
  };

  beforeEach(() => {
    jest.spyOn(service as any, 'getPsychologist').mockResolvedValue(psy);
    prismaMock.appointment.findFirst.mockResolvedValue(appointment);
    prismaMock.payment.create.mockResolvedValue({ id: 'pay1' });
    prismaMock.appointment.update.mockResolvedValue({ id: 'apt1' });
  });

  it('débite la carte et passe à captured', async () => {
    (stripeMock.captureImprint as jest.Mock).mockResolvedValue({
      id: 'pi_1', status: 'succeeded', requiresAction: false,
    });

    const result = await service.captureImprint('user1', 'apt1', { amount: 60 });

    expect(stripeMock.captureImprint).toHaveBeenCalledWith(expect.objectContaining({
      customerId: 'cus_1', paymentMethodId: 'pm_1',
      connectedAccountId: 'acct_1', amount: 60, appointmentId: 'apt1',
    }));
    expect(prismaMock.appointment.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'apt1' },
      data: expect.objectContaining({ cardHoldStatus: 'captured', paymentAmount: 60 }),
    }));
    expect(result.captured).toBe(true);
  });

  it('bascule sur un lien de paiement si SCA requise', async () => {
    (stripeMock.captureImprint as jest.Mock).mockResolvedValue({
      id: null, status: 'requires_action', requiresAction: true,
    });
    const linkSpy = jest.spyOn(service, 'createPaymentLink').mockResolvedValue({
      url: 'https://stripe/link', appointmentId: 'apt1',
    } as any);

    const result = await service.captureImprint('user1', 'apt1', { amount: 60 });

    expect(linkSpy).toHaveBeenCalled();
    expect(result.captured).toBe(false);
    expect(result.fallbackLink).toBe('https://stripe/link');
    // l'empreinte reste secured (pas consommée)
    expect(prismaMock.appointment.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ cardHoldStatus: 'captured' }) }),
    );
  });
});

describe('releaseImprint', () => {
  it('passe l\'empreinte à released sans débit', async () => {
    jest.spyOn(service as any, 'getPsychologist').mockResolvedValue({ id: 'psy1' });
    prismaMock.appointment.findFirst.mockResolvedValue({
      id: 'apt1', psychologistId: 'psy1', cardHoldStatus: 'secured',
    });
    prismaMock.appointment.update.mockResolvedValue({ id: 'apt1' });

    const result = await service.releaseImprint('user1', 'apt1');

    expect(prismaMock.appointment.update).toHaveBeenCalledWith({
      where: { id: 'apt1' },
      data: { cardHoldStatus: 'released' },
    });
    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 3: Lancer les tests pour vérifier l'échec**

Run: `cd apps/api && npx jest subscription.service.spec --no-coverage -t "captureImprint|releaseImprint"`
Expected: FAIL — méthodes inexistantes.

- [ ] **Step 4: Implémenter `captureImprint` et `releaseImprint`**

Dans `subscription.service.ts` (à côté de `markPaidOnSite`) :

```typescript
async captureImprint(
  userId: string,
  appointmentId: string,
  dto: { amount: number },
): Promise<{ captured: boolean; fallbackLink?: string }> {
  const psy = await this.getPsychologist(userId);
  if (!psy.stripeAccountId || !psy.stripeOnboardingComplete) {
    throw new ForbiddenException('Stripe Connect non configuré.');
  }

  const appointment = await this.prisma.appointment.findFirst({
    where: { id: appointmentId, psychologistId: psy.id },
    include: { patient: true },
  });
  if (!appointment) throw new NotFoundException('Rendez-vous introuvable');
  if (appointment.cardHoldStatus !== 'secured') {
    throw new BadRequestException('Aucune empreinte active sur ce rendez-vous.');
  }
  if (!appointment.stripeCustomerId || !appointment.stripePaymentMethodId) {
    throw new BadRequestException('Carte enregistrée introuvable.');
  }

  const result = await this.stripe.captureImprint({
    customerId: appointment.stripeCustomerId,
    paymentMethodId: appointment.stripePaymentMethodId,
    connectedAccountId: psy.stripeAccountId,
    amount: dto.amount,
    appointmentId: appointment.id,
  });

  // SCA requise -> fallback lien de paiement, empreinte conservée
  if (result.requiresAction) {
    const link = await this.createPaymentLink(userId, {
      appointmentId: appointment.id,
      amount: dto.amount,
    } as PaymentLinkDto);
    return { captured: false, fallbackLink: link.url ?? undefined };
  }

  const payment = await this.prisma.payment.create({
    data: {
      psychologistId: psy.id,
      patientId: appointment.patientId,
      type: 'session',
      amount: dto.amount,
      status: 'paid',
      stripePaymentIntentId: result.id,
      appointmentId: appointment.id,
    },
  });

  await this.prisma.appointment.update({
    where: { id: appointment.id },
    data: {
      cardHoldStatus: 'captured',
      paymentAmount: dto.amount,
      paymentIntentId: result.id,
      bookingPaymentStatus: 'paid',
      paidOnline: true,
    },
  });

  await this.audit.log({
    actorId: userId,
    actorType: 'psychologist',
    action: 'CREATE',
    entityType: 'card_imprint_capture',
    entityId: appointment.id,
    metadata: { amount: dto.amount, appointmentId: appointment.id },
  });

  // Reçu patient + ledger comptable
  if (appointment.patient?.email) {
    void this.email
      .sendImprintReceiptToPatient(appointment.patient.email, {
        patientName: appointment.patient.name,
        psychologistName: psy.name,
        amount: dto.amount,
      })
      .catch((err) => this.logger.warn(`Email send failed: ${(err as Error).message}`));
  }
  try {
    this.eventEmitter.emit(
      'payment.completed',
      new PaymentCompletedEvent(
        psy.id, payment.id, null,
        appointment.patient?.name ?? 'Patient',
        dto.amount, new Date(), 'stripe', null,
      ),
    );
  } catch (error) {
    this.logger.error(`Failed to emit payment.completed for imprint capture: ${error}`);
  }

  this.logger.log(`Imprint captured for appointment ${appointment.id}, amount=${dto.amount}€`);
  return { captured: true };
}

async releaseImprint(userId: string, appointmentId: string): Promise<{ success: boolean }> {
  const psy = await this.getPsychologist(userId);
  const appointment = await this.prisma.appointment.findFirst({
    where: { id: appointmentId, psychologistId: psy.id },
  });
  if (!appointment) throw new NotFoundException('Rendez-vous introuvable');
  if (appointment.cardHoldStatus !== 'secured') {
    throw new BadRequestException('Aucune empreinte active sur ce rendez-vous.');
  }

  await this.prisma.appointment.update({
    where: { id: appointmentId },
    data: { cardHoldStatus: 'released' },
  });

  await this.audit.log({
    actorId: userId,
    actorType: 'psychologist',
    action: 'UPDATE',
    entityType: 'card_imprint_release',
    entityId: appointmentId,
    metadata: { appointmentId },
  });

  this.logger.log(`Imprint released for appointment ${appointmentId}`);
  return { success: true };
}
```

> Vérifier que `ForbiddenException`, `BadRequestException`, `NotFoundException`, `PaymentLinkDto`, `PaymentCompletedEvent` sont déjà importés dans le fichier (ils le sont d'après les usages existants).

- [ ] **Step 5: Ajouter l'email `sendImprintReceiptToPatient`**

Dans `email.service.ts`, sur le modèle de `sendRefundConfirmation` :

```typescript
async sendImprintReceiptToPatient(
  to: string,
  data: { patientName: string; psychologistName: string; amount: number },
): Promise<void> {
  await this.send({
    to,
    subject: 'Reçu de paiement',
    html: `<p>Bonjour ${data.patientName},</p>
      <p>Un montant de ${data.amount.toFixed(2)} € a été débité sur la carte enregistrée
      pour votre rendez-vous avec ${data.psychologistName}.</p>`,
  });
}
```

- [ ] **Step 6: Ajouter les endpoints au controller**

Dans `apps/api/src/billing/billing.controller.ts`, importer le DTO :

```typescript
import { CaptureImprintSchema, type CaptureImprintDto } from './dto/capture-imprint.dto';
```

Puis ajouter les routes (après `markPaidOnSite`) :

```typescript
  @Post('imprint/capture/:appointmentId')
  @UseGuards(SubscriptionGuard)
  @RequirePlan(SubscriptionPlan.PRO, SubscriptionPlan.CLINIC)
  @ApiOperation({ summary: 'Encaisser une empreinte bancaire (montant libre)' })
  async captureImprint(
    @CurrentUser() user: KeycloakUser,
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
    @Body() body: CaptureImprintDto,
  ) {
    const parsed = CaptureImprintSchema.parse(body);
    return this.subscriptionService.captureImprint(user.sub, appointmentId, parsed);
  }

  @Post('imprint/release/:appointmentId')
  @UseGuards(SubscriptionGuard)
  @RequirePlan(SubscriptionPlan.PRO, SubscriptionPlan.CLINIC)
  @ApiOperation({ summary: 'Libérer une empreinte bancaire sans débit' })
  async releaseImprint(
    @CurrentUser() user: KeycloakUser,
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
  ) {
    return this.subscriptionService.releaseImprint(user.sub, appointmentId);
  }
```

- [ ] **Step 7: Lancer les tests pour vérifier le succès**

Run: `cd apps/api && npx jest subscription.service.spec --no-coverage -t "captureImprint|releaseImprint"`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/billing/dto/capture-imprint.dto.ts apps/api/src/billing/subscription.service.ts apps/api/src/billing/billing.controller.ts apps/api/src/notifications/email.service.ts apps/api/src/billing/__tests__/subscription.service.spec.ts
git commit -m "feat(billing): endpoints capture + release empreinte"
```

---

## Task 6: Flux B — lien d'empreinte généré par le psy

**Files:**
- Modify: `apps/api/src/billing/subscription.service.ts`
- Modify: `apps/api/src/billing/billing.controller.ts`
- Modify: `apps/api/src/notifications/email.service.ts`
- Test: `apps/api/src/billing/__tests__/subscription.service.spec.ts`

- [ ] **Step 1: Écrire le test qui échoue**

```typescript
describe('createImprintSetupLink', () => {
  it('crée un customer + session setup et passe l\'empreinte à pending', async () => {
    jest.spyOn(service as any, 'getPsychologist').mockResolvedValue({
      id: 'psy1', name: 'Dr X', stripeAccountId: 'acct_1', stripeOnboardingComplete: true,
    });
    prismaMock.appointment.findFirst.mockResolvedValue({
      id: 'apt1', psychologistId: 'psy1', patientId: 'pat1',
      patient: { id: 'pat1', name: 'Patient', email: 'p@test.fr' },
    });
    (stripeMock.createImprintCustomer as jest.Mock).mockResolvedValue({ id: 'cus_1' });
    (stripeMock.createSetupCheckoutSession as jest.Mock).mockResolvedValue({
      id: 'cs_1', url: 'https://stripe/setup',
    });
    prismaMock.appointment.update.mockResolvedValue({ id: 'apt1' });

    const result = await service.createImprintSetupLink('user1', 'apt1');

    expect(stripeMock.createSetupCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'cus_1', appointmentId: 'apt1', expiresInSeconds: 86400 }),
    );
    expect(prismaMock.appointment.update).toHaveBeenCalledWith({
      where: { id: 'apt1' },
      data: { cardHoldStatus: 'pending', paymentMode: 'imprint', stripeCustomerId: 'cus_1' },
    });
    expect(result.url).toBe('https://stripe/setup');
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier l'échec**

Run: `cd apps/api && npx jest subscription.service.spec --no-coverage -t "createImprintSetupLink"`
Expected: FAIL.

- [ ] **Step 3: Implémenter `createImprintSetupLink`**

Dans `subscription.service.ts` :

```typescript
async createImprintSetupLink(
  userId: string,
  appointmentId: string,
): Promise<{ url: string | null }> {
  const psy = await this.getPsychologist(userId);
  if (!psy.stripeAccountId || !psy.stripeOnboardingComplete) {
    throw new ForbiddenException('Stripe Connect non configuré.');
  }
  const appointment = await this.prisma.appointment.findFirst({
    where: { id: appointmentId, psychologistId: psy.id },
    include: { patient: true },
  });
  if (!appointment) throw new NotFoundException('Rendez-vous introuvable');
  if (!appointment.patient?.email) {
    throw new BadRequestException('Le patient doit avoir un email pour enregistrer sa carte.');
  }

  const customer = await this.stripe.createImprintCustomer({
    email: appointment.patient.email,
    name: appointment.patient.name,
    psychologistId: psy.id,
    patientId: appointment.patientId!,
    appointmentId: appointment.id,
  });

  const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'https://psylib.eu';
  const session = await this.stripe.createSetupCheckoutSession({
    customerId: customer.id,
    appointmentId: appointment.id,
    successUrl: `${frontendUrl}/payment/imprint-success?appointmentId=${appointment.id}`,
    cancelUrl: `${frontendUrl}/payment/cancel?appointmentId=${appointment.id}`,
    expiresInSeconds: 86400,
  });

  await this.prisma.appointment.update({
    where: { id: appointment.id },
    data: { cardHoldStatus: 'pending', paymentMode: 'imprint', stripeCustomerId: customer.id },
  });

  void this.email
    .sendImprintRequestToPatient(appointment.patient.email, {
      patientName: appointment.patient.name,
      psychologistName: psy.name,
      setupUrl: session.url ?? '',
    })
    .catch((err) => this.logger.warn(`Email send failed: ${(err as Error).message}`));

  return { url: session.url };
}
```

- [ ] **Step 4: Ajouter l'email `sendImprintRequestToPatient`**

```typescript
async sendImprintRequestToPatient(
  to: string,
  data: { patientName: string; psychologistName: string; setupUrl: string },
): Promise<void> {
  await this.send({
    to,
    subject: 'Sécurisez votre rendez-vous',
    html: `<p>Bonjour ${data.patientName},</p>
      <p>${data.psychologistName} vous demande d'enregistrer une carte bancaire pour
      garantir votre rendez-vous. Aucun montant n'est débité maintenant : vous ne serez
      débité qu'en cas d'absence ou selon la politique d'annulation.</p>
      <p><a href="${data.setupUrl}">Enregistrer ma carte</a></p>`,
  });
}
```

- [ ] **Step 5: Ajouter l'endpoint au controller**

```typescript
  @Post('imprint/setup/:appointmentId')
  @UseGuards(SubscriptionGuard)
  @RequirePlan(SubscriptionPlan.PRO, SubscriptionPlan.CLINIC)
  @ApiOperation({ summary: 'Envoyer un lien d\'empreinte au patient (RDV créé par le psy)' })
  async createImprintSetupLink(
    @CurrentUser() user: KeycloakUser,
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
  ) {
    return this.subscriptionService.createImprintSetupLink(user.sub, appointmentId);
  }
```

- [ ] **Step 6: Lancer le test pour vérifier le succès**

Run: `cd apps/api && npx jest subscription.service.spec --no-coverage -t "createImprintSetupLink"`
Expected: PASS.

- [ ] **Step 7: Lancer toute la suite billing + vérifier le build API**

Run: `cd apps/api && npx jest billing --no-coverage && npx tsc --noEmit -p tsconfig.json`
Expected: tests PASS, pas d'erreur TypeScript.

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/billing/subscription.service.ts apps/api/src/billing/billing.controller.ts apps/api/src/notifications/email.service.ts apps/api/src/billing/__tests__/subscription.service.spec.ts
git commit -m "feat(billing): lien d'empreinte envoyé par le psy (flux B)"
```

---

## Task 7: Réservation publique — branche empreinte

**Files:**
- Modify: `apps/api/src/public-booking/public-booking.service.ts`
- Modify: `apps/api/src/public-booking/dto/public-booking.dto.ts`
- Test: `apps/api/src/public-booking/__tests__/public-booking-payment.spec.ts`

- [ ] **Step 1: Écrire le test qui échoue**

Dans `public-booking-payment.spec.ts`, ajouter un cas : type de consultation `requireImprint=true` → la réservation crée l'appointment en `cardHoldStatus='pending'` et renvoie une `checkoutUrl` de setup.

```typescript
it('demande une empreinte quand le type de consultation l\'exige', async () => {
  // psy onboardé Connect
  prismaMock.psychologist.findFirst.mockResolvedValue({
    id: 'psy1', slug: 'dr-x', name: 'Dr X',
    defaultSessionDuration: 50, defaultSessionRate: 60,
    allowOnlinePayment: true, stripeOnboardingComplete: true, stripeAccountId: 'acct_1',
    user: { email: 'psy@test.fr' },
  });
  prismaMock.consultationType.findFirst.mockResolvedValue({
    id: 'ct1', psychologistId: 'psy1', duration: 50, rate: 60,
    isActive: true, requireImprint: true,
  });
  // ... mocks transaction (voir cas existants du fichier) renvoyant appointment {id:'apt1', patientId:'pat1'}
  (stripeMock.createImprintCustomer as jest.Mock).mockResolvedValue({ id: 'cus_1' });
  (stripeMock.createSetupCheckoutSession as jest.Mock).mockResolvedValue({
    id: 'cs_1', url: 'https://stripe/setup',
  });

  const result = await service.createBooking('dr-x', {
    consultationTypeId: 'ct1',
    patientName: 'Patient', patientEmail: 'p@test.fr',
    scheduledAt: futureIso, // réutiliser le helper de date du fichier
  } as any);

  expect(stripeMock.createSetupCheckoutSession).toHaveBeenCalled();
  expect(result.checkoutUrl).toBe('https://stripe/setup');
  expect(result.requiresImprint).toBe(true);
});
```

> Reprendre la mécanique de mock de transaction Prisma (`$transaction`) des cas existants du fichier — ne pas réinventer.

- [ ] **Step 2: Lancer le test pour vérifier l'échec**

Run: `cd apps/api && npx jest public-booking-payment --no-coverage -t "empreinte"`
Expected: FAIL.

- [ ] **Step 3: Charger `requireImprint` lors de la résolution du type**

Dans `public-booking.service.ts`, le bloc `if (dto.consultationTypeId)` (ligne ~358) récupère déjà `consultationType`. Ajouter une variable de portée fonction au-dessus de la transaction :

```typescript
let requireImprint = false;
```

et dans le bloc :

```typescript
      if (consultationType) {
        duration = consultationType.duration;
        rate = Number(consultationType.rate);
        requireImprint = consultationType.requireImprint;
      }
```

- [ ] **Step 4: Ajouter la branche empreinte après la création de l'appointment**

Juste après la fin de la transaction `$transaction(...)` et l'invalidation du cache (ligne ~442), AVANT le bloc `if (wantsOnlinePayment ...)`, insérer :

```typescript
    // --- Card imprint flow (priorité sur le paiement en ligne classique) ---
    const psyCanCharge =
      psy.allowOnlinePayment && psy.stripeOnboardingComplete && !!psy.stripeAccountId;
    if (requireImprint && psyCanCharge) {
      try {
        const patientId = appointment.patientId!;
        const customer = await this.stripeService.createImprintCustomer({
          email: dto.patientEmail,
          name: dto.patientName,
          psychologistId: psy.id,
          patientId,
          appointmentId: appointment.id,
        });
        const setupSession = await this.stripeService.createSetupCheckoutSession({
          customerId: customer.id,
          appointmentId: appointment.id,
          successUrl: `${this.frontendUrl}/psy/${slug}/booking/success?appointment=${appointment.id}`,
          cancelUrl: `${this.frontendUrl}/psy/${slug}/booking/cancel?appointment=${appointment.id}`,
          expiresInSeconds: 86400,
        });

        await this.prisma.appointment.update({
          where: { id: appointment.id },
          data: {
            cardHoldStatus: 'pending',
            paymentMode: 'imprint',
            stripeCustomerId: customer.id,
          },
        });

        void this.email.sendBookingRequestToPsy(psy.user.email, {
          patientName: dto.patientName,
          patientEmail: dto.patientEmail,
          patientPhone: dto.patientPhone,
          psychologistName: psy.name,
          scheduledAt,
          duration,
          reason: dto.reason,
          dashboardUrl: `${this.frontendUrl}/dashboard/calendar`,
        });

        return {
          success: true,
          appointmentId: appointment.id,
          checkoutUrl: setupSession.url,
          requiresImprint: true,
        };
      } catch (err) {
        this.logger.warn(
          `Failed to create imprint setup for appointment ${appointment.id}: ${err instanceof Error ? err.message : String(err)}`,
        );
        // fallback : RDV normal sans empreinte
      }
    }
```

- [ ] **Step 5: Étendre le type de retour si nécessaire**

Si la méthode `createBooking` a un type de retour explicite, ajouter `requiresImprint?: boolean` à l'union de retour (chercher `requiresPayment?` et l'aligner). Vérifier aussi le DTO `public-booking.dto.ts` — aucun champ d'entrée nouveau requis (l'empreinte est déterminée par le type de consultation, pas par le patient).

- [ ] **Step 6: Lancer le test pour vérifier le succès**

Run: `cd apps/api && npx jest public-booking-payment --no-coverage -t "empreinte"`
Expected: PASS.

- [ ] **Step 7: Lancer toute la suite API + build**

Run: `cd apps/api && npx jest --no-coverage && npx tsc --noEmit -p tsconfig.json`
Expected: tous les tests PASS (vérifier qu'aucun test existant n'est cassé par le changement de retour).

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/public-booking
git commit -m "feat(booking): demande d'empreinte à la réservation publique"
```

---

## Task 8: Frontend — toggle « empreinte » sur le type de consultation

**Files:**
- Modify: le formulaire de type de consultation côté settings (chercher avec la commande ci-dessous)

- [ ] **Step 1: Localiser le formulaire**

Run: `cd apps/web && grep -rln "consultationType\|ConsultationType\|require_imprint\|cancellationDelay" src/components src/app | grep -i consult`
Expected: identifie le composant formulaire (ex. `src/components/settings/consultation-type-form.tsx`).

- [ ] **Step 2: Ajouter le champ au schéma Zod + au formulaire**

Dans le schéma Zod du formulaire, ajouter :

```typescript
  requireImprint: z.boolean().default(false),
```

Dans le JSX, ajouter un `Switch` (shadcn) avec label « Demander une empreinte bancaire » et description « Le patient enregistre sa carte à la réservation ; vous encaissez à la fin de la séance ou en cas d'absence. ». Gater Pro/Clinic : réutiliser le pattern de self-gate par plan déjà présent dans `PaymentSettings` (afficher un upsell désactivé si plan < Pro).

- [ ] **Step 3: Propager le champ dans l'appel API**

Vérifier que le payload create/update du type de consultation inclut `requireImprint` (mapper vers `require_imprint` si l'API attend le snake_case — sinon le DTO Prisma camelCase passe tel quel). Vérifier le DTO côté API du module consultation-types et y ajouter `requireImprint?: boolean` si absent.

- [ ] **Step 4: Vérifier le build Next.js**

Run: `cd apps/web && npx tsc --noEmit`
Expected: pas d'erreur.

- [ ] **Step 5: Commit**

```bash
git add apps/web apps/api/src
git commit -m "feat(web): toggle empreinte sur les types de consultation"
```

---

## Task 9: Frontend — consentement + redirection setup (réservation publique)

**Files:**
- Modify: `apps/web/src/components/booking/payment-choice.tsx` ou `consultation-type-picker.tsx`
- Modify: `apps/web/src/app/psy/[slug]/public-profile-client.tsx`

- [ ] **Step 1: Détecter `requireImprint` sur le type sélectionné**

Le profil public expose déjà les types de consultation. Vérifier que le champ `requireImprint` est présent dans la réponse du profil public (sinon l'ajouter à la projection côté API `public-booking.service.ts` `getTypes`/profil — voir lignes ~193). S'assurer que le type renvoyé inclut `requireImprint`.

- [ ] **Step 2: Afficher l'encart de consentement**

Dans le composant qui précède la soumission de réservation, quand le type sélectionné a `requireImprint === true`, afficher un encart + une **case à cocher obligatoire** :

```tsx
{selectedType?.requireImprint && (
  <div className="rounded-xl border border-border bg-surface p-4 text-sm">
    <p className="font-medium text-text">Empreinte bancaire requise</p>
    <p className="mt-1 text-muted-foreground">
      Pour garantir ce rendez-vous, le praticien demande l'enregistrement de votre carte.
      Aucun montant n'est débité maintenant. Vous ne serez débité qu'en cas d'absence
      ou selon la politique d'annulation du praticien.
    </p>
    <label className="mt-3 flex items-start gap-2">
      <input type="checkbox" checked={imprintConsent}
        onChange={(e) => setImprintConsent(e.target.checked)} className="mt-1" />
      <span>J'accepte l'enregistrement de ma carte et la politique d'annulation.</span>
    </label>
  </div>
)}
```

Bloquer la soumission (`disabled`) tant que `selectedType.requireImprint && !imprintConsent`.

- [ ] **Step 3: Rediriger vers le Checkout setup après réservation**

Dans `public-profile-client.tsx`, là où la réponse de réservation est traitée : si `response.checkoutUrl` est présent (déjà le cas pour le paiement classique via `requiresPayment`), la redirection `window.location.href = response.checkoutUrl` couvre aussi `requiresImprint`. Vérifier que le code redirige bien dès qu'une `checkoutUrl` est renvoyée, quel que soit le mode.

- [ ] **Step 4: Vérifier le build**

Run: `cd apps/web && npx tsc --noEmit`
Expected: pas d'erreur.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src
git commit -m "feat(web): consentement + redirection empreinte (réservation publique)"
```

---

## Task 10: Frontend — actions psy (encaisser / libérer) + flux B + smart slot

**Files:**
- Modify: `apps/web/src/lib/api/billing.ts`
- Modify: `apps/web/src/components/billing/payment-actions.tsx`
- Modify: `apps/web/src/components/sessions/smart-slot-picker-dialog.tsx`

- [ ] **Step 1: Ajouter les méthodes au client billing**

Dans `apps/web/src/lib/api/billing.ts`, sur le modèle des méthodes existantes (`markPaidOnSite`, `refund`) :

```typescript
  captureImprint: (appointmentId: string, amount: number) =>
    apiClient.post<{ captured: boolean; fallbackLink?: string }>(
      `/billing/imprint/capture/${appointmentId}`, { amount }),

  releaseImprint: (appointmentId: string) =>
    apiClient.post<{ success: boolean }>(`/billing/imprint/release/${appointmentId}`, {}),

  createImprintSetupLink: (appointmentId: string) =>
    apiClient.post<{ url: string | null }>(`/billing/imprint/setup/${appointmentId}`, {}),
```

- [ ] **Step 2: Ajouter les boutons + dialog dans `payment-actions.tsx`**

Quand l'appointment a `cardHoldStatus === 'secured'`, afficher deux boutons :
- **« Encaisser »** → ouvre un dialog avec un champ montant (présélection = tarif du type / `paymentAmount` / défaut), boutons « Encaisser X € » et « Annuler ». Au submit : `billingApi.captureImprint(id, amount)`. Si la réponse a `fallbackLink`, afficher un toast « La carte nécessite une validation, un lien de paiement a été envoyé au patient. » Sinon toast succès et invalider la query agenda/paiements (React Query `queryClient.invalidateQueries`).
- **« Libérer l'empreinte »** → `confirm-dialog` puis `billingApi.releaseImprint(id)` + toast + invalidation.

Afficher un `PaymentBadge`/texte d'état selon `cardHoldStatus` (`pending` = « Empreinte en attente », `secured` = « Carte enregistrée », `captured` = « Encaissé », `released` = « Empreinte libérée »).

Suivre le pattern de toast/erreur déjà utilisé dans ce composant pour `refund`/`markPaidOnSite`.

- [ ] **Step 3: Ajouter la case « Demander une empreinte » au SmartSlotPicker**

Dans `smart-slot-picker-dialog.tsx`, ajouter une case à cocher « Demander une empreinte bancaire » (visible si plan Pro/Clinic et Connect onboardé — réutiliser la détection de plan existante). Après création de l'appointment, si cochée, appeler `billingApi.createImprintSetupLink(appointmentId)` et afficher un toast « Lien d'empreinte envoyé au patient ».

> Note : le SmartSlotPicker crée un Appointment via son endpoint existant ; l'empreinte est un appel séparé post-création (pas de modif du endpoint de création).

- [ ] **Step 4: Vérifier le build**

Run: `cd apps/web && npx tsc --noEmit`
Expected: pas d'erreur.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src
git commit -m "feat(web): encaisser/libérer empreinte + lien empreinte (psy)"
```

---

## Task 11: Vérification globale + page success + conformité

**Files:**
- Create: `apps/web/src/app/payment/imprint-success/page.tsx`
- Modify: `apps/web/src/app/modele-consentement/...` (ou doc consentement)
- Test: build complet + suites

- [ ] **Step 1: Page de confirmation d'enregistrement de carte (flux B)**

Créer `apps/web/src/app/payment/imprint-success/page.tsx` — page publique simple : « Votre carte a bien été enregistrée. Aucun montant n'a été débité. Vous serez débité uniquement en cas d'absence ou selon la politique d'annulation de votre praticien. » (réutiliser le style des autres pages `/payment/success`).

- [ ] **Step 2: Mention conformité**

Ajouter au modèle de consentement patient (`docs/modele-consentement-patient.md` + page `apps/web/src/app/modele-consentement/`) un paragraphe court sur l'empreinte bancaire / frais d'annulation. Conserver le wording validé en spec.

- [ ] **Step 3: Lancer toutes les suites de tests API**

Run: `cd apps/api && npx jest --no-coverage`
Expected: 100% PASS (aucune régression).

- [ ] **Step 4: Build complet web + api**

Run: `cd apps/web && npm run build`
Expected: build Next.js vert.

Run: `cd apps/api && npx tsc --noEmit -p tsconfig.json`
Expected: pas d'erreur TypeScript.

- [ ] **Step 5: Mettre à jour MEMORY.md**

Ajouter une ligne dans `MEMORY.md` (section « Features déployées ») pointant vers un nouveau fichier topic `card-imprint.md` résumant la feature (mécanique SetupIntent, endpoints, flux A/B, fallback SCA).

- [ ] **Step 6: Commit final**

```bash
git add apps/web/src/app/payment/imprint-success docs apps/web/src/app/modele-consentement
git commit -m "feat(billing): page confirmation empreinte + mention conformité"
```

---

## Notes de déploiement (hors tâches de code)

- **Webhook Stripe** : `checkout.session.completed` est déjà écouté — le mode `setup` passe par le même event, aucun nouveau type de webhook à enregistrer côté dashboard Stripe.
- **Blocage Connect** : la capture/release ne fonctionnera en prod qu'une fois **Stripe Connect activé** sur le compte plateforme live (`acct_1TEZxuL1z4Q7xELX`) — cf. blocage 2026-06-02. Le développement et les tests unitaires ne sont pas bloqués.
- **Migration prod** : appliquer `20260604_card_imprint` via la procédure VPS habituelle (`npx prisma migrate deploy` dans le conteneur API).
- **Déploiement** : VPS (API Docker rebuild) + Vercel (`npx vercel --prod --yes` depuis la racine).

## Self-Review (effectuée)

- **Couverture spec** : §4 schéma → T1 ; §5 flux A → T7+T9 ; flux B → T6+T10 ; flux C capture/release → T5+T10 ; fallback SCA → T3+T5 ; §6 endpoints → T5+T6 ; §7 méthodes Stripe → T2+T3 ; §8 conformité/audit → T5 (audit.log) + T11 ; §9 frontend → T8/T9/T10/T11. ✅
- **Types cohérents** : `captureImprint` (Stripe) renvoie `{id, status, requiresAction}` ; `captureImprint` (service) renvoie `{captured, fallbackLink}` — distincts et utilisés correctement. `cardHoldStatus` valeurs alignées avec l'enum de T1.
- **Pas de placeholder** : chaque step de code contient le code réel ; les seules instructions « localiser » (T8 step1, T9 step1) sont des commandes grep concrètes, pas du code à deviner.
