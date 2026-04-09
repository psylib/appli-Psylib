# Auto Invoice Generation — Design Spec

**Date:** 2026-04-09
**Status:** Draft
**Feature:** Automatic invoice generation after session completion or Stripe payment

---

## Problem

Psychologists currently create invoices manually for each session. This is tedious and error-prone. Patients need invoices for mutual/complementary health insurance reimbursement. The invoicing system (CRUD, PDF generation, email sending) already exists but requires manual action for every single session.

## Solution

Event-driven automatic invoice generation via BullMQ. Two triggers, one pipeline:

1. **Session completed** → draft invoice (psy sends manually when ready)
2. **Stripe payment confirmed** → paid invoice + auto email to patient

Psychologists control the behavior via two toggles in Settings > Cabinet.

---

## Data Model Changes

### Psychologist (2 new fields)

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `autoInvoice` | Boolean | `true` | Enable/disable auto invoice generation |
| `autoInvoiceEmail` | Boolean | `true` | Auto-send email when invoice is paid (Stripe) |

### Session (1 new field)

The Session model currently has no lifecycle status. We add one:

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `status` | Enum `SessionStatus` | `draft` | Lifecycle: `draft` → `completed` |

Enum `SessionStatus`: `draft | completed`

- New sessions default to `draft`
- Psy clicks "Terminer la séance" → sets `status: completed`
- This is also the trigger for auto invoice generation

### Invoice (4 new fields)

| Field | Type | Nullable | Purpose |
|-------|------|----------|---------|
| `sessionId` | String FK → Session | Yes | Links invoice to the session it was generated from |
| `paymentId` | String FK → Payment | Yes | Links invoice to the Stripe payment |
| `paidAt` | DateTime | Yes | Actual payment date (distinct from `issuedAt`) |
| `source` | Enum `InvoiceSource` | `manual` | How the invoice was created: `manual` or `auto` |

Enum `InvoiceSource`: `manual | auto`

### Migration Notes

- `sessionId` on Invoice is nullable (manual invoices won't have it)
- No unique constraint on `sessionId` — a session could theoretically have a manual invoice + auto invoice (edge case, handled by idempotence check)
- `paymentId` nullable — draft invoices from session completion won't have a payment
- `source` defaults to `manual` — existing invoices automatically get this value
- Session `status` defaults to `draft` — existing sessions get this value
- Existing invoices/sessions unaffected (all new fields have defaults or nullable)

---

## Triggers & Flow

### Trigger 1: Session Completed

The Session model gets a new `status` field (enum: `draft | completed`). When the psy clicks "Terminer la séance", the session transitions from `draft` to `completed`.

```
Psy clicks "Terminer la séance"
  → PUT /sessions/:id  { status: 'completed' }
  → SessionsService.update() checks:
      - status changed from 'draft' to 'completed'
      - loads psychologist with: include { autoInvoice: true }
      - psychologist.autoInvoice === true
      - no existing invoice for this sessionId (idempotence)
  → Enqueues BullMQ job: 'generate-invoice'
      payload: {
        type: 'session_completed',
        sessionId,
        psychologistId,
        patientId,
        amount: session.rate (from session record, falls back to psychologist.defaultSessionRate),
        sessionDate: session.date
      }
  → Worker:
      1. Creates Invoice (status: 'draft', source: 'auto')
      2. Generates PDF via existing buildPdfBuffer() — single session only (not monthly batch)
      3. Audit log: INVOICE_AUTO_GENERATED
      4. No email sent
```

**Note:** The `UpdateSessionDto` must be extended to accept the new `status` field.

### Trigger 2: Stripe Payment Confirmed

The existing webhook handler processes `checkout.session.completed` (not `payment_intent.succeeded`). This event fires for both booking prepayments and payment links. The integration hooks into the existing `handleBookingPaymentCompleted()` and `handlePaymentLinkCompleted()` methods in `SubscriptionService`.

```
Stripe webhook: checkout.session.completed
  → SubscriptionService.handleBookingPaymentCompleted() or handlePaymentLinkCompleted()
  → After existing logic (appointment status update, etc.):
      - Resolves psychologistId from appointment record
      - Loads psychologist to check autoInvoice toggle
      - Checks: psychologist.autoInvoice === true
      - Checks: no existing invoice for this appointment (idempotence via paymentId)
  → Enqueues BullMQ job: 'generate-invoice'
      payload: {
        type: 'payment_received',
        appointmentId,
        psychologistId,
        patientId,
        amount: appointment rate in euros (from consultation type / appointment record, NOT Stripe centimes),
        paymentIntentId: from checkout session,
        sessionDate: appointment.scheduledAt
      }
  → Worker:
      1. Creates Invoice (status: 'paid', paidAt: now, source: 'auto')
      2. Generates PDF via existing buildPdfBuffer() — single session only
      3. Audit log: INVOICE_AUTO_GENERATED
      4. If psychologist.autoInvoiceEmail === true:
         → Sends email with PDF attachment via existing sendInvoiceSent()
```

**Amount handling:** The amount comes from the appointment/consultation type rate (in euros, Decimal), NOT from Stripe (which uses centimes). This avoids unit conversion issues.

### Idempotence

The worker checks for existing invoices before creating:
- For `session_completed`: query `Invoice WHERE sessionId = X`
- For `payment_received`: query `Invoice WHERE paymentId = X`
- If found → skip (log warning, don't fail)

This handles retries, duplicate webhooks, and race conditions.

---

## BullMQ Job Structure

### Queue Name
`invoice-generation`

### Job Data
```typescript
interface GenerateInvoiceJobData {
  type: 'session_completed' | 'payment_received';
  psychologistId: string;
  patientId: string;
  amount: number;
  sessionId?: string;        // for session_completed
  appointmentId?: string;    // for payment_received
  paymentIntentId?: string;  // for payment_received
  sessionDate: string;       // ISO date for invoice issuedAt
}
```

### Worker Behavior
- Retry: 3 attempts with exponential backoff (1s, 5s, 25s)
- On permanent failure: log error, do not create partial invoice
- Concurrency: 3 (low — invoice generation is not high-throughput)

---

## Settings UI

### Location
Settings > Cabinet (existing page `apps/web/src/app/(dashboard)/dashboard/settings/practice/page.tsx`)

### New Section: "Facturation"

Two toggles in a card:

1. **Facturation automatique** (maps to `autoInvoice`)
   - Label: "Facturation automatique"
   - Description: "Génère automatiquement une facture quand une séance est terminée ou un paiement reçu"
   - Default: ON

2. **Envoi auto par email** (maps to `autoInvoiceEmail`)
   - Label: "Envoi automatique par email"
   - Description: "Envoie automatiquement la facture par email quand le paiement est confirmé (Stripe)"
   - Default: ON
   - Only visible/enabled when `autoInvoice` is ON

### API
- Uses existing `PATCH /psychologists/me` or settings endpoint to persist toggles
- Fields added to the update DTO

---

## Frontend Changes

### Toast Notification
When the session is marked completed and the API returns success, the frontend shows a toast (no WebSocket needed — the toast fires on the successful PUT response, the invoice is generated async in the background):
- Toast: "Facture générée — Facture en cours de création pour [Patient Name]"
- The invoice list auto-refreshes via React Query invalidation

### Invoices Page Enhancements
- **"Auto" badge**: Blue pill badge next to status badge for auto-generated invoices
- **Highlight**: New auto-generated invoices highlighted with amber background row
- **"Marquer payée" action**: Button on `sent` invoices to manually mark as paid (sets `status: paid`, `paidAt: now`)

### Mark as Paid
New endpoint: `PATCH /invoices/:id/mark-paid`
- Sets `status: paid`, `paidAt: now()`
- Creates audit log: `INVOICE_MARKED_PAID`
- Only allowed on invoices with status `draft` or `sent`

---

## Backend Changes Summary

### New Files
- `apps/api/src/invoices/invoice-generation.processor.ts` — BullMQ worker

### Modified Files
- `apps/api/prisma/schema.prisma` — SessionStatus enum, InvoiceSource enum, 1 field on Session, 2 fields on Psychologist, 4 fields on Invoice
- `apps/api/src/invoices/invoices.module.ts` — Register BullMQ queue + processor
- `apps/api/src/invoices/invoices.service.ts` — Add `createAutoInvoice()`, `markAsPaid()`, adapt `buildPdfBuffer()` for single-session mode
- `apps/api/src/invoices/invoices.controller.ts` — Add `PATCH /:id/mark-paid`
- `apps/api/src/sessions/sessions.service.ts` — Add `status` to UpdateSessionDto, dispatch job on session completion
- `apps/api/src/sessions/dto/update-session.dto.ts` — Add `status` field
- `apps/api/src/billing/subscription.service.ts` — Dispatch job in handleBookingPaymentCompleted() and handlePaymentLinkCompleted()
- `apps/api/src/psychologists/dto/update-psychologist.dto.ts` — Add toggle fields
- `apps/web/src/app/(dashboard)/dashboard/settings/practice/page.tsx` — Add invoice toggles section
- `apps/web/src/components/invoices/invoices-page.tsx` — Auto badge, mark-paid button, highlight
- `apps/web/src/lib/api/invoices.ts` — Add `markAsPaid()` method

### Migration
- Single Prisma migration adding: SessionStatus enum, InvoiceSource enum, 1 field on Session (default 'draft'), 2 fields on Psychologist (default true), 4 fields on Invoice (nullable/default). All non-breaking.

---

## Audit Logging

| Action | actor_type | entity_type | When |
|--------|-----------|-------------|------|
| `INVOICE_AUTO_GENERATED` | system | invoice | Worker creates auto invoice |
| `INVOICE_MARKED_PAID` | psychologist | invoice | Psy clicks "Marquer payée" |
| `INVOICE_SENT` | psychologist | invoice | (existing) Psy sends email |
| `INVOICE_AUTO_EMAILED` | system | invoice | Worker auto-sends paid invoice email |

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| PDF generation fails | Job retries (3x). If permanent failure, log error. Invoice NOT created (atomic). |
| Email sending fails | Invoice still created as `paid`. Email failure logged. Psy can resend manually. |
| Duplicate webhook | Idempotence check skips. No error. |
| Session has no rate | Use `psychologist.defaultSessionRate`. If null, skip auto-generation (log warning). |
| Patient has no email | Invoice created but email skipped (no recipient). |

---

## Testing Strategy

### Unit Tests
- `InvoiceGenerationProcessor`: mock Prisma + PDFKit, test both trigger paths
- Idempotence: verify skip when invoice already exists
- Toggle respect: verify no generation when `autoInvoice === false`
- Email logic: verify email sent only when `paid` + `autoInvoiceEmail === true`

### Integration Tests
- Session completion → verify invoice created in DB
- Stripe webhook → verify invoice created + email queued
- Mark as paid → verify status transition + audit log
- Settings update → verify toggles persist

---

## Out of Scope

- Bulk monthly invoice generation (future iteration)
- Invoice deletion/archive
- Custom invoice templates/branding
- Invoice numbering per-year reset configuration
- Feature gating by plan (all plans get auto-invoicing)
