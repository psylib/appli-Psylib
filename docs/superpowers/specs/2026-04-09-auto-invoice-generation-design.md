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

### Invoice (3 new fields)

| Field | Type | Nullable | Purpose |
|-------|------|----------|---------|
| `sessionId` | String FK → Session | Yes | Links invoice to the session it was generated from |
| `paymentId` | String FK → Payment | Yes | Links invoice to the Stripe payment |
| `paidAt` | DateTime | Yes | Actual payment date (distinct from `issuedAt`) |

### Migration Notes

- `sessionId` on Invoice is nullable (manual invoices won't have it)
- No unique constraint on `sessionId` — a session could theoretically have a manual invoice + auto invoice (edge case, handled by idempotence check)
- `paymentId` nullable — draft invoices from session completion won't have a payment
- Existing invoices unaffected (all new fields nullable)

---

## Triggers & Flow

### Trigger 1: Session Completed

```
Psy clicks "Terminer la séance"
  → PUT /sessions/:id  { status: 'completed' }
  → SessionsService.update() checks:
      - status changed to 'completed'
      - psychologist.autoInvoice === true
      - no existing invoice for this sessionId (idempotence)
  → Enqueues BullMQ job: 'generate-invoice'
      payload: {
        type: 'session_completed',
        sessionId,
        psychologistId,
        patientId,
        amount: session.rate (from consultation type or default rate),
        sessionDate: session.date
      }
  → Worker:
      1. Creates Invoice (status: 'draft', source: 'auto')
      2. Generates PDF via existing buildPdfBuffer()
      3. Stores PDF reference
      4. Creates audit log: INVOICE_AUTO_GENERATED
      5. No email sent
```

### Trigger 2: Stripe Payment Confirmed

```
Stripe webhook: payment_intent.succeeded
  → WebhookController processes payment
  → Checks: psychologist.autoInvoice === true
  → Checks: no existing invoice for this appointment/session (idempotence)
  → Enqueues BullMQ job: 'generate-invoice'
      payload: {
        type: 'payment_received',
        appointmentId,
        psychologistId,
        patientId,
        amount: payment amount from Stripe,
        paymentIntentId,
        sessionDate: appointment.scheduledAt
      }
  → Worker:
      1. Creates Invoice (status: 'paid', paidAt: now, source: 'auto')
      2. Generates PDF via existing buildPdfBuffer()
      3. Stores PDF reference
      4. Creates audit log: INVOICE_AUTO_GENERATED
      5. If psychologist.autoInvoiceEmail === true:
         → Sends email with PDF attachment via existing sendInvoiceSent()
```

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
When the invoice generation job completes (via WebSocket or polling):
- Toast: "📄 Facture générée — Facture PSY-2026-XXXX créée en brouillon pour [Patient Name]"
- Actions in toast: "Voir la facture" | "Envoyer au patient"

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
- `apps/api/src/invoices/dto/mark-paid.dto.ts` — DTO (empty, just for validation)

### Modified Files
- `apps/api/prisma/schema.prisma` — 2 fields on Psychologist, 3 fields on Invoice
- `apps/api/src/invoices/invoices.module.ts` — Register BullMQ queue + processor
- `apps/api/src/invoices/invoices.service.ts` — Add `createAutoInvoice()`, `markAsPaid()`
- `apps/api/src/invoices/invoices.controller.ts` — Add `PATCH /:id/mark-paid`
- `apps/api/src/sessions/sessions.service.ts` — Dispatch job on session completion
- `apps/api/src/billing/webhook.controller.ts` — Dispatch job on payment success
- `apps/api/src/psychologists/dto/update-psychologist.dto.ts` — Add toggle fields
- `apps/web/src/app/(dashboard)/dashboard/settings/practice/page.tsx` — Add invoice toggles section
- `apps/web/src/components/invoices/invoices-page.tsx` — Auto badge, mark-paid button, highlight
- `apps/web/src/lib/api/invoices.ts` — Add `markAsPaid()` method

### Migration
- Single Prisma migration adding 5 nullable/default fields (non-breaking)

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
