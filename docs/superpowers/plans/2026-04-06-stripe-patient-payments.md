# Stripe Patient Payments — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow patients to pay for their therapy sessions online — either at booking (prepayment) or after the session (payment link sent by the psychologist).

**Architecture:** Extends existing Stripe Connect Express infrastructure (already implemented in NestJS backend). Adds configurable payment settings per psychologist, extends the existing public booking page with Stripe Checkout integration, adds post-session payment links, configurable refund policies, and a payments dashboard. Feature gated to Pro/Clinic plans.

**Tech Stack:** NestJS, Prisma, Stripe Connect Express, Next.js App Router, shadcn/ui, React Query, Zod

**Spec:** `docs/superpowers/specs/2026-04-06-stripe-patient-payments-design.md`

---

## Conventions & Patterns

Before implementing, read these codebase patterns:

- **API client:** `apps/web/src/lib/api/client.ts` exports `apiClient` with `get/post/put/patch/delete` methods. All API methods MUST use `apiClient`, never raw `fetch`. The client auto-adds `/api/v1` prefix, `Bearer` token, `Content-Type`, and error handling.
- **Controller pattern:** All controllers use `@CurrentUser() user: KeycloakUser` (not `@Req()`). Service methods receive `userId: string` (from `user.sub`) and internally resolve `psychologistId` via `getPsychologist(userId)` or direct Prisma lookup.
- **Public endpoints:** Public controllers (e.g., `PublicBookingController`) simply omit `@UseGuards(KeycloakGuard, RolesGuard)` at class level. There is no `@Public()` decorator.
- **Plan gate:** Use `@UseGuards(SubscriptionGuard)` + `@RequirePlan(SubscriptionPlan.PRO, SubscriptionPlan.CLINIC)` together.
- **Audit logging:** Use `AuditService.log({ actorId, actorType, action, entityType, entityId, metadata, req })`.
- **Amount convention:** `createPaymentLinkSession()` receives amount in **euros** (float), converts to cents internally with `Math.round(amount * 100)`. The existing `createBookingCheckoutSession()` receives cents — document this clearly.

---

## File Structure

### Backend (apps/api)

| File | Action | Responsibility |
|---|---|---|
| `prisma/schema.prisma` | Modify | Add `PaymentMode` enum, fields on `Psychologist`, `Payment`; extend enums |
| `src/billing/stripe.service.ts` | Modify | Add `createRefund()`, `createPaymentLinkSession()` |
| `src/billing/subscription.service.ts` | Modify | Add connect settings, payment link, refund, payments list, webhook extensions |
| `src/billing/billing.controller.ts` | Modify | Add 4 new routes with `@CurrentUser()` pattern |
| `src/billing/dto/connect-settings.dto.ts` | Create | Zod DTO |
| `src/billing/dto/payment-link.dto.ts` | Create | Zod DTO |
| `src/billing/dto/refund.dto.ts` | Create | Zod DTO |
| `src/appointments/appointment-cancel.controller.ts` | Create | Public cancel-by-token routes (no auth guards) |
| `src/appointments/appointments.service.ts` | Modify | Add `getCancelInfo()`, `cancelByToken()` |
| `src/appointments/appointments.module.ts` | Modify | Import `BillingModule`, add new controller |
| `src/billing/billing.controller.ts` | Modify | Add `PUT /appointments/:id/mark-paid` route |
| `src/availability/availability.controller.ts` | Modify | Add `PUT /:id` route |
| `src/availability/availability.service.ts` | Modify | Add `updateSlot()` |
| `src/notifications/email.service.ts` | Modify | Add 4 email templates, update booking email with cancelToken |
| `src/public-booking/public-booking.service.ts` | Modify | Pass cancelToken to booking email |

### Frontend (apps/web)

| File | Action | Responsibility |
|---|---|---|
| `src/lib/api/billing.ts` | Modify | Add 6 new methods using `apiClient` pattern |
| `src/app/(dashboard)/dashboard/settings/payments/page.tsx` | Create | Settings page for Stripe Connect + payment config |
| `src/components/billing/connect-onboarding-card.tsx` | Create | Stripe Connect onboarding card |
| `src/components/billing/payment-settings-form.tsx` | Create | Payment config form |
| `src/app/(dashboard)/dashboard/payments/page.tsx` | Create | Payments dashboard page |
| `src/components/billing/payments-dashboard.tsx` | Create | KPIs + payments list |
| `src/components/billing/payment-badge.tsx` | Create | Status badge component |
| `src/components/billing/payment-actions.tsx` | Create | Payment link + mark paid + refund buttons |
| `src/app/psy/[slug]/page.tsx` | **Modify** | Extend existing page with booking form + Stripe checkout |
| `src/app/psy/[slug]/success/page.tsx` | Create | Booking/payment success page |
| `src/app/appointments/cancel/[token]/page.tsx` | Create | Cancellation page |
| `src/components/layouts/sidebar.tsx` | Modify | Add "Paiements" nav link |

### Shared Types

| File | Action | Responsibility |
|---|---|---|
| `packages/shared-types/src/index.ts` | Modify | Add `PaymentMode` enum, `REFUNDED` to enums, `ConnectSettings` type |

---

## Task 1: Prisma Schema & Migration

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Modify: `packages/shared-types/src/index.ts`

- [ ] **Step 1: Add `PaymentMode` enum and `refunded` statuses to schema**

In `schema.prisma`, add new enum:
```prisma
enum PaymentMode {
  prepaid
  postpaid
  both
}
```

Add `refunded` to `PaymentStatus` enum:
```prisma
enum PaymentStatus {
  pending
  paid
  failed
  refunded
}
```

Add `refunded` to `BookingPaymentStatus` enum:
```prisma
enum BookingPaymentStatus {
  none
  pending_payment
  paid
  payment_failed
  refunded
}
```

- [ ] **Step 2: Add fields to `Psychologist` model**

After the existing `stripeOnboardingComplete` field, add:
```prisma
  paymentMode           PaymentMode @default(both) @map("payment_mode")
  cancellationDelay     Int         @default(24) @map("cancellation_delay")
  autoRefund            Boolean     @default(true) @map("auto_refund")
```

- [ ] **Step 3: Add fields to `Payment` model**

Add to the `Payment` model:
```prisma
  stripeCheckoutSessionId String?      @unique @map("stripe_checkout_session_id")
  appointmentId           String?      @db.Uuid @map("appointment_id")
  appointment             Appointment? @relation(fields: [appointmentId], references: [id])

  @@index([appointmentId])
```

Add the reverse relation to the `Appointment` model:
```prisma
  payments              Payment[]
```

- [ ] **Step 4: Update shared types**

In `packages/shared-types/src/index.ts`:
- Add `REFUNDED = 'refunded'` to `PaymentStatus` enum
- Add `REFUNDED = 'refunded'` to `BookingPaymentStatus` enum
- Add:
```typescript
export enum PaymentMode {
  PREPAID = 'prepaid',
  POSTPAID = 'postpaid',
  BOTH = 'both',
}

export interface ConnectSettings {
  paymentMode: PaymentMode;
  cancellationDelay: number;
  autoRefund: boolean;
  defaultSessionRate: number;
}
```

- [ ] **Step 5: Generate and run migration**

```bash
cd apps/api && npx prisma migrate dev --name add-payment-mode-and-refund
```

- [ ] **Step 6: Commit**

```bash
git add apps/api/prisma/ packages/shared-types/
git commit -m "feat(schema): add PaymentMode enum, refunded status, payment FK to appointment"
```

---

## Task 2: StripeService — Add `createRefund()` + `createPaymentLinkSession()`

**Files:**
- Modify: `apps/api/src/billing/stripe.service.ts`

- [ ] **Step 1: Add `createRefund()` method**

After `createBookingCheckoutSession()`:
```typescript
  async createRefund(paymentIntentId: string): Promise<Stripe.Refund> {
    return this.stripe.refunds.create({
      payment_intent: paymentIntentId,
    });
  }
```

- [ ] **Step 2: Add `createPaymentLinkSession()` method**

> Note: `amount` param is in **euros** (float). Converted to cents internally.

```typescript
  /**
   * Creates a Stripe Checkout for post-session payment link.
   * @param params.amount Amount in euros (e.g., 60.00)
   */
  async createPaymentLinkSession(params: {
    connectedAccountId: string;
    amount: number; // euros
    patientEmail: string;
    psychologistName: string;
    appointmentId: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<Stripe.Checkout.Session> {
    return this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Séance avec ${params.psychologistName}`,
            },
            unit_amount: Math.round(params.amount * 100), // euros → cents
          },
          quantity: 1,
        },
      ],
      customer_email: params.patientEmail,
      payment_intent_data: {
        application_fee_amount: 0,
        transfer_data: {
          destination: params.connectedAccountId,
        },
        metadata: {
          appointmentId: params.appointmentId,
          type: 'payment_link',
        },
      },
      metadata: {
        appointmentId: params.appointmentId,
        type: 'payment_link',
      },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    });
  }
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/billing/stripe.service.ts
git commit -m "feat(stripe): add createRefund and createPaymentLinkSession methods"
```

---

## Task 3: SubscriptionService — Connect Settings, Payment Link, Refund, Payments

**Files:**
- Modify: `apps/api/src/billing/subscription.service.ts`
- Create: `apps/api/src/billing/dto/connect-settings.dto.ts`
- Create: `apps/api/src/billing/dto/payment-link.dto.ts`
- Create: `apps/api/src/billing/dto/refund.dto.ts`

- [ ] **Step 1: Create DTOs**

`apps/api/src/billing/dto/connect-settings.dto.ts`:
```typescript
import { z } from 'zod';

export const ConnectSettingsSchema = z.object({
  paymentMode: z.enum(['prepaid', 'postpaid', 'both']),
  cancellationDelay: z.number().int().min(0).max(168),
  autoRefund: z.boolean(),
  defaultSessionRate: z.number().min(0).max(10000),
});

export type ConnectSettingsDto = z.infer<typeof ConnectSettingsSchema>;
```

`apps/api/src/billing/dto/payment-link.dto.ts`:
```typescript
import { z } from 'zod';

export const PaymentLinkSchema = z.object({
  appointmentId: z.string().uuid().optional(),
  sessionId: z.string().uuid().optional(),
  amount: z.number().min(0.5).max(10000).optional(),
}).refine((data) => data.appointmentId || data.sessionId, {
  message: 'appointmentId or sessionId is required',
});

export type PaymentLinkDto = z.infer<typeof PaymentLinkSchema>;
```

`apps/api/src/billing/dto/refund.dto.ts`:
```typescript
import { z } from 'zod';

export const RefundSchema = z.object({
  appointmentId: z.string().uuid(),
});

export type RefundDto = z.infer<typeof RefundSchema>;
```

- [ ] **Step 2: Add `updateConnectSettings()` to SubscriptionService**

> Pattern: receives `userId`, resolves `psychologistId` internally.

```typescript
  async updateConnectSettings(userId: string, dto: ConnectSettingsDto) {
    const psy = await this.prisma.psychologist.findUnique({
      where: { userId },
    });
    if (!psy) throw new NotFoundException('Psychologist not found');
    if (!psy.stripeOnboardingComplete) {
      throw new BadRequestException('Stripe Connect onboarding not complete');
    }
    return this.prisma.psychologist.update({
      where: { id: psy.id },
      data: {
        paymentMode: dto.paymentMode,
        cancellationDelay: dto.cancellationDelay,
        autoRefund: dto.autoRefund,
        defaultSessionRate: dto.defaultSessionRate,
      },
    });
  }
```

- [ ] **Step 3: Add `createPaymentLink()` to SubscriptionService**

```typescript
  async createPaymentLink(userId: string, dto: PaymentLinkDto) {
    const psy = await this.prisma.psychologist.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (!psy?.stripeOnboardingComplete || !psy.stripeAccountId) {
      throw new BadRequestException('Stripe Connect not configured');
    }

    const appointment = dto.appointmentId
      ? await this.prisma.appointment.findFirst({
          where: { id: dto.appointmentId, psychologistId: psy.id },
          include: { patient: true },
        })
      : null;

    const session = dto.sessionId
      ? await this.prisma.session.findFirst({
          where: { id: dto.sessionId, psychologistId: psy.id },
          include: { patient: true },
        })
      : null;

    const target = appointment || session;
    if (!target) throw new NotFoundException('Appointment or session not found');

    const amount = dto.amount || Number(psy.defaultSessionRate) || 60;
    const patientEmail = target.patient?.email;
    if (!patientEmail) throw new BadRequestException('Patient has no email');

    const frontendUrl = process.env.FRONTEND_URL || 'https://psylib.eu';
    const checkoutSession = await this.stripeService.createPaymentLinkSession({
      connectedAccountId: psy.stripeAccountId,
      amount,
      patientEmail,
      psychologistName: psy.name,
      appointmentId: appointment?.id || '',
      successUrl: `${frontendUrl}/psy/${psy.slug}/success?type=payment`,
      cancelUrl: `${frontendUrl}/psy/${psy.slug}`,
    });

    const payment = await this.prisma.payment.create({
      data: {
        psychologistId: psy.id,
        patientId: target.patient?.id,
        type: 'session',
        amount,
        status: 'pending',
        stripeCheckoutSessionId: checkoutSession.id,
        appointmentId: appointment?.id,
      },
    });

    // Audit log
    await this.auditService.log({
      actorId: userId,
      actorType: 'psychologist',
      action: 'CREATE',
      entityType: 'payment',
      entityId: payment.id,
      metadata: { type: 'payment_link', amount },
    });

    // Send email to patient
    await this.emailService.sendPaymentLink({
      to: patientEmail,
      patientName: target.patient?.name || '',
      psychologistName: psy.name,
      amount,
      checkoutUrl: checkoutSession.url!,
    });

    return { checkoutUrl: checkoutSession.url, paymentId: payment.id };
  }
```

- [ ] **Step 4: Add `handleRefund()` to SubscriptionService**

```typescript
  async handleRefund(userId: string, appointmentId: string) {
    const psy = await this.prisma.psychologist.findUnique({ where: { userId } });
    if (!psy) throw new NotFoundException('Psychologist not found');

    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, psychologistId: psy.id },
      include: { patient: true, payments: true },
    });
    if (!appointment) throw new NotFoundException('Appointment not found');
    if (!appointment.paidOnline || appointment.bookingPaymentStatus !== 'paid') {
      throw new BadRequestException('Appointment was not paid online');
    }
    if (!appointment.paymentIntentId) {
      throw new BadRequestException('No payment intent found');
    }

    await this.stripeService.createRefund(appointment.paymentIntentId);

    await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { bookingPaymentStatus: 'refunded' },
    });

    await this.prisma.payment.updateMany({
      where: { appointmentId, psychologistId: psy.id },
      data: { status: 'refunded' },
    });

    // Get refund amount from the payment record
    const paidPayment = appointment.payments?.find((p) => p.status === 'paid' || p.status === 'refunded');
    const refundAmount = paidPayment ? Number(paidPayment.amount) : 0;

    // Audit log
    await this.auditService.log({
      actorId: userId,
      actorType: 'psychologist',
      action: 'UPDATE',
      entityType: 'payment',
      entityId: appointmentId,
      metadata: { type: 'refund', amount: refundAmount },
    });

    if (appointment.patient?.email) {
      await this.emailService.sendRefundConfirmation({
        to: appointment.patient.email,
        patientName: appointment.patient.name || '',
        amount: refundAmount,
      });
    }

    return { success: true };
  }
```

- [ ] **Step 5: Add `markPaidOnSite()` to SubscriptionService**

```typescript
  async markPaidOnSite(userId: string, appointmentId: string) {
    const psy = await this.prisma.psychologist.findUnique({ where: { userId } });
    if (!psy) throw new NotFoundException('Psychologist not found');

    await this.prisma.appointment.update({
      where: { id: appointmentId, psychologistId: psy.id },
      data: { bookingPaymentStatus: 'paid', paidOnline: false },
    });

    // Also create a payment record for tracking
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true, consultationType: true },
    });

    if (appointment) {
      await this.prisma.payment.create({
        data: {
          psychologistId: psy.id,
          patientId: appointment.patientId,
          type: 'session',
          amount: Number(appointment.consultationType?.rate || psy.defaultSessionRate || 0),
          status: 'paid',
          appointmentId,
        },
      });
    }

    return { success: true };
  }
```

- [ ] **Step 6: Add `getPayments()` to SubscriptionService**

```typescript
  async getPayments(userId: string, query: {
    from?: string;
    to?: string;
    status?: string;
    mode?: string; // 'online' | 'onsite'
    page?: number;
    limit?: number;
  }) {
    const psy = await this.prisma.psychologist.findUnique({ where: { userId } });
    if (!psy) throw new NotFoundException('Psychologist not found');

    const page = query.page || 1;
    const limit = query.limit || 20;
    const where: any = { psychologistId: psy.id };

    if (query.status) where.status = query.status;
    if (query.mode === 'online') where.stripePaymentIntentId = { not: null };
    if (query.mode === 'onsite') where.stripePaymentIntentId = null;
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: {
          patient: { select: { id: true, name: true, email: true } },
          appointment: { select: { id: true, scheduledAt: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.payment.count({ where }),
    ]);

    // KPIs for current month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthPayments = await this.prisma.payment.findMany({
      where: { psychologistId: psy.id, createdAt: { gte: monthStart } },
    });

    const totalReceived = monthPayments
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const totalPending = monthPayments
      .filter((p) => p.status === 'pending')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const onlineCount = monthPayments.filter((p) => p.stripePaymentIntentId).length;

    return {
      payments,
      total,
      page,
      limit,
      kpis: {
        totalReceived,
        totalPending,
        transactionCount: monthPayments.length,
        onlineRate: monthPayments.length > 0 ? Math.round((onlineCount / monthPayments.length) * 100) : 0,
      },
    };
  }
```

- [ ] **Step 7: Extend webhook handler for `payment_link` and `charge.refunded`**

In the `handleWebhookEvent()` switch/case, add:

```typescript
case 'charge.refunded': {
  const refundCharge = event.data.object as Stripe.Charge;
  const refundPiId = typeof refundCharge.payment_intent === 'string'
    ? refundCharge.payment_intent
    : refundCharge.payment_intent?.id;
  if (refundPiId) {
    await this.prisma.appointment.updateMany({
      where: { paymentIntentId: refundPiId },
      data: { bookingPaymentStatus: 'refunded' },
    });
    await this.prisma.payment.updateMany({
      where: { stripePaymentIntentId: refundPiId },
      data: { status: 'refunded' },
    });
  }
  break;
}
```

In the existing `handleCheckoutCompleted()` method, add handling for `payment_link` type:

```typescript
// After existing booking_payment handling:
if (session.metadata?.type === 'payment_link') {
  const appointmentId = session.metadata.appointmentId;
  const paymentIntentId = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id;

  // Update the Payment record
  await this.prisma.payment.updateMany({
    where: { stripeCheckoutSessionId: session.id },
    data: { status: 'paid', stripePaymentIntentId: paymentIntentId },
  });

  // Update the Appointment
  if (appointmentId) {
    await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        bookingPaymentStatus: 'paid',
        paidOnline: true,
        paymentIntentId,
      },
    });
  }

  // Notify psychologist
  const payment = await this.prisma.payment.findFirst({
    where: { stripeCheckoutSessionId: session.id },
    include: { patient: true, appointment: { include: { psychologist: { include: { user: true } } } } },
  });
  if (payment?.appointment?.psychologist?.user?.email) {
    await this.emailService.sendPaymentReceived({
      to: payment.appointment.psychologist.user.email,
      psychologistName: payment.appointment.psychologist.name,
      patientName: payment.patient?.name || '',
      amount: Number(payment.amount),
    });
  }
}
```

- [ ] **Step 8: Inject AuditService in SubscriptionService constructor**

Add `private readonly auditService: AuditService` to the constructor. Import from `../common/audit.service`.

- [ ] **Step 9: Commit**

```bash
git add apps/api/src/billing/
git commit -m "feat(billing): add connect settings, payment link, refund, mark-paid, payments list"
```

---

## Task 4: BillingController — New Routes

**Files:**
- Modify: `apps/api/src/billing/billing.controller.ts`

- [ ] **Step 1: Add new route handlers**

> Pattern: use `@CurrentUser() user: KeycloakUser` and pass `user.sub` to service methods.

After the existing `getConnectStatus()` handler, add:

```typescript
  @Put('connect/settings')
  @UseGuards(SubscriptionGuard)
  @RequirePlan(SubscriptionPlan.PRO, SubscriptionPlan.CLINIC)
  async updateConnectSettings(
    @CurrentUser() user: KeycloakUser,
    @Body() body: ConnectSettingsDto,
  ) {
    const parsed = ConnectSettingsSchema.parse(body);
    return this.subscriptionService.updateConnectSettings(user.sub, parsed);
  }

  @Post('payment-link')
  @UseGuards(SubscriptionGuard)
  @RequirePlan(SubscriptionPlan.PRO, SubscriptionPlan.CLINIC)
  async createPaymentLink(
    @CurrentUser() user: KeycloakUser,
    @Body() body: PaymentLinkDto,
  ) {
    const parsed = PaymentLinkSchema.parse(body);
    return this.subscriptionService.createPaymentLink(user.sub, parsed);
  }

  @Post('refund')
  @UseGuards(SubscriptionGuard)
  @RequirePlan(SubscriptionPlan.PRO, SubscriptionPlan.CLINIC)
  async refund(
    @CurrentUser() user: KeycloakUser,
    @Body() body: RefundDto,
  ) {
    const parsed = RefundSchema.parse(body);
    return this.subscriptionService.handleRefund(user.sub, parsed.appointmentId);
  }

  @Post('mark-paid/:appointmentId')
  async markPaidOnSite(
    @CurrentUser() user: KeycloakUser,
    @Param('appointmentId') appointmentId: string,
  ) {
    return this.subscriptionService.markPaidOnSite(user.sub, appointmentId);
  }

  @Get('payments')
  @UseGuards(SubscriptionGuard)
  @RequirePlan(SubscriptionPlan.PRO, SubscriptionPlan.CLINIC)
  async getPayments(
    @CurrentUser() user: KeycloakUser,
    @Query() query,
  ) {
    return this.subscriptionService.getPayments(user.sub, query);
  }
```

- [ ] **Step 2: Add imports**

```typescript
import { ConnectSettingsSchema, ConnectSettingsDto } from './dto/connect-settings.dto';
import { PaymentLinkSchema, PaymentLinkDto } from './dto/payment-link.dto';
import { RefundSchema, RefundDto } from './dto/refund.dto';
import { RequirePlan } from './decorators/require-plan.decorator';
import { SubscriptionGuard } from './guards/subscription.guard';
import { SubscriptionPlan } from '@psyscale/shared-types';
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/billing/billing.controller.ts
git commit -m "feat(billing): add payment settings, payment-link, refund, mark-paid, payments routes"
```

---

## Task 5: Appointment Cancel-by-Token (Separate Public Controller)

**Files:**
- Create: `apps/api/src/appointments/appointment-cancel.controller.ts`
- Modify: `apps/api/src/appointments/appointments.service.ts`
- Modify: `apps/api/src/appointments/appointments.module.ts`

> The existing `AppointmentsController` has `@UseGuards(KeycloakGuard, RolesGuard)` at class level. We create a separate controller without guards for the public cancel endpoints (same pattern as `PublicBookingController`).

- [ ] **Step 1: Add `getCancelInfo()` to AppointmentsService**

```typescript
  async getCancelInfo(cancelToken: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { cancelToken },
      include: {
        psychologist: { select: { name: true, cancellationDelay: true, autoRefund: true } },
        patient: { select: { name: true } },
      },
    });
    if (!appointment) throw new NotFoundException('Appointment not found');
    if (appointment.status === 'cancelled') {
      return { appointment, alreadyCancelled: true };
    }

    const hoursUntil = (new Date(appointment.scheduledAt).getTime() - Date.now()) / (1000 * 60 * 60);
    const withinDelay = hoursUntil > (appointment.psychologist?.cancellationDelay || 24);
    const canAutoRefund = withinDelay && appointment.paidOnline && (appointment.psychologist?.autoRefund ?? true);

    return { appointment, alreadyCancelled: false, withinDelay, canAutoRefund, hoursUntil };
  }
```

- [ ] **Step 2: Add `cancelByToken()` to AppointmentsService**

```typescript
  async cancelByToken(cancelToken: string) {
    const info = await this.getCancelInfo(cancelToken);
    if (info.alreadyCancelled) {
      return { success: true, message: 'Already cancelled' };
    }

    const appointment = info.appointment;

    await this.prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: 'cancelled' },
    });

    let refunded = false;
    if (info.canAutoRefund && appointment.paymentIntentId) {
      try {
        await this.stripeService.createRefund(appointment.paymentIntentId);
        await this.prisma.appointment.update({
          where: { id: appointment.id },
          data: { bookingPaymentStatus: 'refunded' },
        });
        await this.prisma.payment.updateMany({
          where: { appointmentId: appointment.id },
          data: { status: 'refunded' },
        });
        refunded = true;
      } catch (e) {
        this.logger.error(`Refund failed for appointment ${appointment.id}`, e);
      }
    }

    // Audit log
    await this.auditService.log({
      actorId: appointment.patientId || 'anonymous',
      actorType: 'patient',
      action: 'UPDATE',
      entityType: 'appointment',
      entityId: appointment.id,
      metadata: { action: 'cancel_by_token', refunded },
    });

    // Notify psychologist (need to include user relation for psy email)
    const fullPsy = await this.prisma.psychologist.findUnique({
      where: { id: appointment.psychologistId },
      include: { user: true },
    });
    if (fullPsy?.user?.email) {
      await this.emailService.sendCancellationNotification({
        to: fullPsy.user.email,
        psychologistName: fullPsy.name,
        patientName: appointment.patient?.name || '',
        scheduledAt: appointment.scheduledAt,
        refunded,
      });
    }

    return { success: true, refunded, withinDelay: info.withinDelay };
  }
```

- [ ] **Step 3: Create `appointment-cancel.controller.ts`**

```typescript
import { Controller, Get, Post, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AppointmentsService } from './appointments.service';

@ApiTags('Appointment Cancel')
@Controller('appointments/cancel')
// NO auth guards — public endpoints
export class AppointmentCancelController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get(':token')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async getCancelInfo(@Param('token') token: string) {
    return this.appointmentsService.getCancelInfo(token);
  }

  @Post(':token')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async cancelByToken(@Param('token') token: string) {
    return this.appointmentsService.cancelByToken(token);
  }
}
```

- [ ] **Step 4: Update AppointmentsModule**

```typescript
import { BillingModule } from '../billing/billing.module';
import { AppointmentCancelController } from './appointment-cancel.controller';

@Module({
  imports: [
    NotificationsModule,
    forwardRef(() => WaitlistModule),
    BillingModule, // for StripeService
  ],
  controllers: [AppointmentsController, AppointmentCancelController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
```

Inject `StripeService` and `AuditService` in `AppointmentsService` constructor.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/appointments/
git commit -m "feat(appointments): add public cancel-by-token controller with auto-refund"
```

---

## Task 6: Availability — Add PUT endpoint

**Files:**
- Modify: `apps/api/src/availability/availability.service.ts`
- Modify: `apps/api/src/availability/availability.controller.ts`

- [ ] **Step 1: Add `updateSlot()` to AvailabilityService**

```typescript
  async updateSlot(psychologistId: string, slotId: string, data: { startTime?: string; endTime?: string; isActive?: boolean }) {
    const slot = await this.prisma.availability.findFirst({
      where: { id: slotId, psychologistId },
    });
    if (!slot) throw new NotFoundException('Slot not found');
    return this.prisma.availability.update({
      where: { id: slotId },
      data,
    });
  }
```

- [ ] **Step 2: Add PUT route to AvailabilityController**

> Check the existing controller pattern for `@CurrentUser()` vs `@Req()`. Use the same pattern.

```typescript
  @Put(':id')
  async updateSlot(@CurrentUser() user: KeycloakUser, @Param('id') id: string, @Body() body) {
    const psy = await this.prisma.psychologist.findUnique({ where: { userId: user.sub } });
    return this.availabilityService.updateSlot(psy.id, id, body);
  }
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/availability/
git commit -m "feat(availability): add PUT endpoint for updating individual slots"
```

---

## Task 7: Email Templates + Update Booking Email with cancelToken

**Files:**
- Modify: `apps/api/src/notifications/email.service.ts`
- Modify: `apps/api/src/public-booking/public-booking.service.ts`

- [ ] **Step 1: Add `sendPaymentLink()` email method**

```typescript
  async sendPaymentLink(params: {
    to: string;
    patientName: string;
    psychologistName: string;
    amount: number;
    checkoutUrl: string;
  }) {
    const html = this.layout(`
      <h2>Lien de paiement</h2>
      <p>Bonjour ${params.patientName},</p>
      <p>${params.psychologistName} vous invite à régler votre séance.</p>
      <p><strong>Montant :</strong> ${params.amount.toFixed(2)} €</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${params.checkoutUrl}" style="background-color: #3D52A0; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Payer en ligne
        </a>
      </div>
      <p style="color: #666; font-size: 14px;">Ce lien est sécurisé et géré par Stripe.</p>
    `);
    await this.send(params.to, `Paiement séance — ${params.psychologistName}`, html);
  }
```

- [ ] **Step 2: Add `sendRefundConfirmation()` email method**

```typescript
  async sendRefundConfirmation(params: {
    to: string;
    patientName: string;
    amount: number;
  }) {
    const html = this.layout(`
      <h2>Remboursement confirmé</h2>
      <p>Bonjour ${params.patientName},</p>
      <p>Votre paiement de <strong>${params.amount.toFixed(2)} €</strong> a été remboursé.</p>
      <p>Le montant sera crédité sur votre compte dans un délai de 5 à 10 jours ouvrés.</p>
    `);
    await this.send(params.to, 'Remboursement confirmé', html);
  }
```

- [ ] **Step 3: Add `sendCancellationNotification()` email method**

```typescript
  async sendCancellationNotification(params: {
    to: string;
    psychologistName: string;
    patientName: string;
    scheduledAt: Date;
    refunded: boolean;
  }) {
    const date = new Date(params.scheduledAt).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
    });
    const refundNote = params.refunded
      ? '<p style="color: #0D9488;">Le patient a été remboursé automatiquement.</p>'
      : '<p style="color: #F59E0B;">Aucun remboursement automatique. Vous pouvez rembourser manuellement depuis votre dashboard.</p>';
    const html = this.layout(`
      <h2>RDV annulé par le patient</h2>
      <p>Bonjour ${params.psychologistName},</p>
      <p><strong>${params.patientName}</strong> a annulé son rendez-vous du <strong>${date}</strong>.</p>
      ${refundNote}
    `);
    await this.send(params.to, `RDV annulé — ${params.patientName}`, html);
  }
```

- [ ] **Step 4: Add `sendPaymentReceived()` email method (psy notification)**

```typescript
  async sendPaymentReceived(params: {
    to: string;
    psychologistName: string;
    patientName: string;
    amount: number;
  }) {
    const html = this.layout(`
      <h2>Paiement reçu</h2>
      <p>Bonjour ${params.psychologistName},</p>
      <p><strong>${params.patientName}</strong> a réglé sa séance en ligne.</p>
      <p><strong>Montant :</strong> ${params.amount.toFixed(2)} €</p>
      <p>Le virement sera effectué sur votre compte Stripe sous 2-7 jours ouvrés.</p>
    `);
    await this.send(params.to, `Paiement reçu — ${params.patientName}`, html);
  }
```

- [ ] **Step 5: Update `sendBookingReceivedToPatient()` to include cancel link**

Add `cancelToken` and `cancelUrl` to the method signature and include a cancel link in the email body:

```typescript
// Update the method signature:
async sendBookingReceivedToPatient(
  to: string,
  data: {
    patientName: string;
    psychologistName: string;
    scheduledAt: Date;
    duration: number;
    cancelUrl?: string; // NEW
  }
)

// Add to the email HTML body:
${data.cancelUrl ? `
  <p style="margin-top: 16px;">
    <a href="${data.cancelUrl}" style="color: #666; font-size: 13px;">
      Annuler ce rendez-vous
    </a>
  </p>
` : ''}
```

- [ ] **Step 6: Update `PublicBookingService.bookAppointment()` to pass cancelToken in email**

In `apps/api/src/public-booking/public-booking.service.ts`, find the call to `sendBookingReceivedToPatient` and add the cancel URL:

```typescript
const frontendUrl = process.env.FRONTEND_URL || 'https://psylib.eu';
void this.email.sendBookingReceivedToPatient(dto.patientEmail, {
  patientName: dto.patientName,
  psychologistName: psy.name,
  scheduledAt,
  duration,
  cancelUrl: `${frontendUrl}/appointments/cancel/${cancelToken}`,
});
```

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/notifications/email.service.ts apps/api/src/public-booking/public-booking.service.ts
git commit -m "feat(email): add payment, refund, cancel templates + cancel link in booking email"
```

---

## Task 8: Frontend — Billing API Client Extensions

**Files:**
- Modify: `apps/web/src/lib/api/billing.ts`

- [ ] **Step 1: Add new methods using `apiClient` pattern**

```typescript
import { ConnectSettings, PaymentMode } from '@psyscale/shared-types';

// Add to the billingApi object:

  // Stripe Connect
  startConnectOnboarding: (token: string) =>
    apiClient.post<{ url: string }>('/billing/connect/onboard', {}, token),

  getConnectStatus: (token: string) =>
    apiClient.get<{
      chargesEnabled: boolean;
      payoutsEnabled: boolean;
      detailsSubmitted: boolean;
    }>('/billing/connect/status', token),

  updateConnectSettings: (settings: ConnectSettings, token: string) =>
    apiClient.put<void>('/billing/connect/settings', settings, token),

  // Payment links
  createPaymentLink: (data: { appointmentId?: string; sessionId?: string; amount?: number }, token: string) =>
    apiClient.post<{ checkoutUrl: string; paymentId: string }>('/billing/payment-link', data, token),

  // Refunds
  refund: (appointmentId: string, token: string) =>
    apiClient.post<{ success: boolean }>('/billing/refund', { appointmentId }, token),

  // Mark paid on site
  markPaidOnSite: (appointmentId: string, token: string) =>
    apiClient.post<{ success: boolean }>(`/billing/mark-paid/${appointmentId}`, {}, token),

  // Payments dashboard
  getPayments: (query: { from?: string; to?: string; status?: string; mode?: string; page?: number }, token: string) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => { if (v) params.set(k, String(v)); });
    return apiClient.get<PaymentsResponse>(`/billing/payments?${params}`, token);
  },
```

Add types:
```typescript
export interface PaymentsResponse {
  payments: PaymentItem[];
  total: number;
  page: number;
  limit: number;
  kpis: {
    totalReceived: number;
    totalPending: number;
    transactionCount: number;
    onlineRate: number;
  };
}

export interface PaymentItem {
  id: string;
  amount: number;
  status: string;
  type: string;
  stripePaymentIntentId: string | null;
  createdAt: string;
  patient: { id: string; name: string; email: string } | null;
  appointment: { id: string; scheduledAt: string } | null;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/lib/api/billing.ts
git commit -m "feat(api-client): add connect, payment-link, refund, mark-paid, payments methods"
```

---

## Task 9: Frontend — Settings Payments Page (Stripe Connect + Config)

**Files:**
- Create: `apps/web/src/app/(dashboard)/dashboard/settings/payments/page.tsx`
- Create: `apps/web/src/components/billing/connect-onboarding-card.tsx`
- Create: `apps/web/src/components/billing/payment-settings-form.tsx`

- [ ] **Step 1: Create `connect-onboarding-card.tsx`**

Component showing:
- Loading: skeleton
- Not onboarded: CTA "Connecter mon compte bancaire" → `billingApi.startConnectOnboarding()` → redirect to Stripe URL
- Onboarded: green badge "Compte Stripe actif", chargesEnabled/payoutsEnabled status

Uses `useQuery(['connectStatus'], ...)` + `useMutation`.

- [ ] **Step 2: Create `payment-settings-form.tsx`**

Form with `react-hook-form` + `zod`:
- Radio group: `paymentMode` (prepaid / postpaid / both)
- Number input: `defaultSessionRate`
- Select: `cancellationDelay` (24h / 48h / 72h)
- Switch: `autoRefund`
- Save button → `billingApi.updateConnectSettings()` + toast

Only rendered when `stripeOnboardingComplete === true`.

- [ ] **Step 3: Create `settings/payments/page.tsx`**

```typescript
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { billingApi } from '@/lib/api/billing';
import { ConnectOnboardingCard } from '@/components/billing/connect-onboarding-card';
import { PaymentSettingsForm } from '@/components/billing/payment-settings-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PaymentSettingsPage() {
  const { token } = useAuth();
  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => billingApi.getSubscription(token!),
    enabled: !!token,
  });

  const isPro = subscription?.plan === 'pro' || subscription?.plan === 'clinic';

  if (!isPro) {
    return (
      <div className="rounded-xl border border-border bg-white p-8 text-center">
        <h2 className="text-lg font-semibold mb-2">Paiements en ligne</h2>
        <p className="text-muted-foreground mb-4">
          Encaissez vos séances en ligne. Disponible à partir du plan Pro.
        </p>
        <Button asChild>
          <Link href="/dashboard/settings/billing">Voir les plans</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Paiements en ligne</h1>
      <ConnectOnboardingCard />
      <PaymentSettingsForm />
    </div>
  );
}
```

- [ ] **Step 4: Add link in settings navigation**

Find the settings page layout/nav and add "Paiements en ligne" link to `/dashboard/settings/payments` with a `CreditCard` icon.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/(dashboard)/dashboard/settings/payments/ apps/web/src/components/billing/connect-onboarding-card.tsx apps/web/src/components/billing/payment-settings-form.tsx
git commit -m "feat(ui): add payment settings page with Stripe Connect onboarding"
```

---

## Task 10: Frontend — Payments Dashboard Page

**Files:**
- Create: `apps/web/src/app/(dashboard)/dashboard/payments/page.tsx`
- Create: `apps/web/src/components/billing/payments-dashboard.tsx`
- Create: `apps/web/src/components/billing/payment-badge.tsx`
- Modify: `apps/web/src/components/layouts/sidebar.tsx`

- [ ] **Step 1: Create `payment-badge.tsx`**

```typescript
import { Badge } from '@/components/ui/badge';

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
  paid: { label: 'Payé', className: 'bg-green-100 text-green-800' },
  failed: { label: 'Échoué', className: 'bg-red-100 text-red-800' },
  refunded: { label: 'Remboursé', className: 'bg-gray-100 text-gray-800' },
};

export function PaymentBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { label: status, className: '' };
  return <Badge className={config.className}>{config.label}</Badge>;
}
```

- [ ] **Step 2: Create `payments-dashboard.tsx`**

Component with:
- 4 KPI cards: total encaissé, en attente, nb transactions, taux en ligne
- Filters row: date range (2 date inputs), status select, mode select (en ligne / sur place)
- Data table: date, patient, montant, mode (icon + label), statut (PaymentBadge), actions
- Actions column: "Rembourser" button (if paid + online), "Voir RDV" link
- Pagination in-card (`border-t border-border px-4 py-3`)
- Uses `useQuery(['payments', filters], ...)` with debounced filter changes

- [ ] **Step 3: Create payments page**

```typescript
'use client';
import { PaymentsDashboard } from '@/components/billing/payments-dashboard';

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Paiements</h1>
      <PaymentsDashboard />
    </div>
  );
}
```

- [ ] **Step 4: Add "Paiements" to sidebar**

In `sidebar.tsx`, add to `NAV_ITEMS` array:
```typescript
{ label: 'Paiements', href: '/dashboard/payments', icon: CreditCard },
```
Import `CreditCard` from `lucide-react`.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/(dashboard)/dashboard/payments/ apps/web/src/components/billing/payments-dashboard.tsx apps/web/src/components/billing/payment-badge.tsx apps/web/src/components/layouts/sidebar.tsx
git commit -m "feat(ui): add payments dashboard with KPIs, filters, table, and refund actions"
```

---

## Task 11: Frontend — Payment Actions on Appointments + Patient Payment Section

**Files:**
- Create: `apps/web/src/components/billing/payment-actions.tsx`
- Modify: appointment/session detail views

- [ ] **Step 1: Create `payment-actions.tsx`**

Component that takes an `appointment` prop and renders contextual actions:
- If `bookingPaymentStatus === 'none'` or `'pending_payment'` + psy has Connect:
  - "Envoyer lien de paiement" → `billingApi.createPaymentLink({ appointmentId })` → toast + copy URL
- If `bookingPaymentStatus === 'paid'` + `paidOnline`:
  - "Rembourser" → confirm dialog → `billingApi.refund(appointmentId)` → toast
- If `bookingPaymentStatus !== 'paid'`:
  - "Marquer payé sur place" → `billingApi.markPaidOnSite(appointmentId)` → toast
- Status badge: `<PaymentBadge status={bookingPaymentStatus} />`

Uses `useMutation` with `onSuccess` → `queryClient.invalidateQueries`.

- [ ] **Step 2: Integrate into appointment views**

Add `<PaymentActions appointment={appointment} />` to:
- Calendar appointment detail/popover
- Session detail page

- [ ] **Step 3: Add payment section to patient detail page**

In the patient detail page (`apps/web/src/app/(dashboard)/dashboard/patients/[id]/page.tsx`), add a "Paiements" tab or section:
- Fetch payments filtered by patientId via `billingApi.getPayments({ patientId }, token)` (may need to add `patientId` filter to the API query)
- Show list: date, amount, status badge
- Show totals: paid, pending

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/billing/payment-actions.tsx
git commit -m "feat(ui): add payment actions on appointments + patient payment section"
```

---

## Task 12: Frontend — Extend Public Booking Page with Payment Flow

**Files:**
- Modify: `apps/web/src/app/psy/[slug]/page.tsx` (existing SSR page)
- Create: `apps/web/src/app/psy/[slug]/success/page.tsx`

> The page at `/psy/[slug]` already exists with SSR, metadata, JSON-LD, and a `PublicProfileClient` component. We extend it, not replace it.

- [ ] **Step 1: Extend `PublicProfileClient` with booking form**

Find the existing `PublicProfileClient` component (imported by the page). Add/extend:
- Slot calendar: fetch available slots via `GET /public/psy/:slug/slots`
- Week navigation (previous/next)
- On slot click → show booking form in a slide-over or below the calendar
- Form fields: name, email, phone (optional), reason (optional), RGPD checkbox, honeypot hidden field
- Zod validation on submit
- Submit → `POST /public/psy/:slug/book` with `payOnline: true/false` based on psy config
- If response has `checkoutUrl` → `window.location.href = checkoutUrl` (Stripe redirect)
- If no payment → redirect to `/psy/[slug]/success`

- [ ] **Step 2: Create success page**

`apps/web/src/app/psy/[slug]/success/page.tsx`:
- Checkmark icon animation
- "Votre rendez-vous est confirmé"
- Recap from query params: date, time, psychologist name
- Note: "Un email de confirmation vous a été envoyé"
- "Retour à l'accueil" button

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/psy/
git commit -m "feat(ui): extend public booking page with slot selection, form, and Stripe checkout"
```

---

## Task 13: Frontend — Cancel Appointment Page

**Files:**
- Create: `apps/web/src/app/appointments/cancel/[token]/page.tsx`

- [ ] **Step 1: Create cancellation page**

Client-side page, no auth required. Uses direct `fetch` to public API:
1. On mount: `GET /api/v1/appointments/cancel/:token` → get cancel info
2. If `alreadyCancelled` → "Ce rendez-vous a déjà été annulé" message
3. If `withinDelay` → "Vous pouvez annuler ce rendez-vous" + refund info if applicable
4. If not `withinDelay` → "Annulation tardive — aucun remboursement automatique" warning
5. "Confirmer l'annulation" button → `POST /api/v1/appointments/cancel/:token`
6. Show result: success message, refund status

Clean, minimal design matching PsyLib brand. No sidebar/dashboard layout.

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/appointments/
git commit -m "feat(ui): add appointment cancellation page with refund info"
```

---

## Task 14: Build Verification & Tests

**Files:** All modified files

- [ ] **Step 1: Run Prisma generate**

```bash
cd apps/api && npx prisma generate
```

- [ ] **Step 2: Run API tests**

```bash
cd apps/api && npm test
```
Fix any type errors from new fields/methods.

- [ ] **Step 3: Run Next.js build**

```bash
cd apps/web && npm run build
```
Fix any type errors or missing imports.

- [ ] **Step 4: Add key integration tests**

Create `apps/api/src/billing/__tests__/payment-link.spec.ts`:
- Test `createPaymentLink()` with valid appointment → expect Stripe session + payment record + email sent
- Test `createPaymentLink()` without Connect → expect BadRequestException
- Test `createPaymentLink()` with non-existent appointment → expect NotFoundException

Create `apps/api/src/appointments/__tests__/cancel-by-token.spec.ts`:
- Test `getCancelInfo()` with valid token → expect appointment data + delay calculation
- Test `getCancelInfo()` with invalid token → expect NotFoundException
- Test `cancelByToken()` within delay + autoRefund → expect refund + cancelled status
- Test `cancelByToken()` outside delay → expect cancelled, no refund
- Test `cancelByToken()` already cancelled → expect idempotent response

Create `apps/api/src/billing/__tests__/refund.spec.ts`:
- Test `handleRefund()` with paid online appointment → expect Stripe refund + status update
- Test `handleRefund()` with non-online appointment → expect BadRequestException

- [ ] **Step 5: Run all tests**

```bash
cd apps/api && npm test
```
Expected: All tests pass.

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "test: add integration tests for payment link, cancel-by-token, and refund flows"
```
