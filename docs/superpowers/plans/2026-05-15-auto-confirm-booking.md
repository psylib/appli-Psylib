# Auto-Confirm Booking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Switch public booking from "request pending approval" to Doctolib-style auto-confirmation — patients book, it's confirmed instantly, psy is notified with easy cancel option.

**Architecture:** Text and status changes across 7 files. Backend: change appointment status from `scheduled` to `confirmed` for public bookings + Stripe webhook. Frontend: update all patient-facing copy. Emails: rewrite patient confirmation + psy notification templates.

**Tech Stack:** NestJS, Next.js App Router, Prisma, Resend emails

**Spec:** `docs/superpowers/specs/2026-05-15-auto-confirm-booking-design.md`

---

### Task 1: Backend — Auto-confirm public bookings

**Files:**
- Modify: `apps/api/src/public-booking/public-booking.service.ts:429`

- [ ] **Step 1: Change appointment status to `confirmed`**

In `public-booking.service.ts`, line 429, change:

```typescript
// Before
status: 'scheduled',

// After
status: 'confirmed',
```

- [ ] **Step 2: Verify build**

Run: `cd apps/api && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/public-booking/public-booking.service.ts
git commit -m "feat(booking): auto-confirm public appointments instead of scheduled"
```

---

### Task 2: Backend — Fix Stripe webhook status override

**Files:**
- Modify: `apps/api/src/billing/subscription.service.ts:601`

- [ ] **Step 1: Change Stripe webhook status to `confirmed`**

In `subscription.service.ts`, line 601, change:

```typescript
// Before
status: 'scheduled',

// After
status: 'confirmed',
```

- [ ] **Step 2: Verify build**

Run: `cd apps/api && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/billing/subscription.service.ts
git commit -m "fix(billing): stripe webhook sets confirmed status instead of scheduled"
```

---

### Task 3: Frontend — Update BookingModal texts

**Files:**
- Modify: `apps/web/src/app/psy/[slug]/public-profile-client.tsx:234,396,402`

- [ ] **Step 1: Change modal title (line 234)**

```typescript
// Before
<h2 className="text-lg font-semibold text-foreground mb-1">Confirmer la demande</h2>

// After
<h2 className="text-lg font-semibold text-foreground mb-1">Réserver un rendez-vous</h2>
```

- [ ] **Step 2: Change submit button text (line 396)**

```typescript
// Before
: 'Envoyer ma demande'}

// After
: 'Réserver'}
```

- [ ] **Step 3: Change footer text (line 402)**

```typescript
// Before
: 'Aucun compte requis · Votre demande sera confirmée par le praticien'}

// After
: 'Aucun compte requis · Confirmation immédiate'}
```

- [ ] **Step 4: Verify build**

Run: `cd apps/web && npx next build 2>&1 | tail -5`
Expected: Build succeeds (or check with `npx tsc --noEmit`)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/psy/[slug]/public-profile-client.tsx
git commit -m "feat(booking): update modal texts for auto-confirmation"
```

---

### Task 4: Frontend — Update confirmation page

**Files:**
- Modify: `apps/web/src/app/psy/[slug]/confirmation/page.tsx:15,72-76,78-81,101-104`

- [ ] **Step 1: Change metadata title (line 15)**

```typescript
// Before
title: 'Demande envoyée — PsyLib',

// After
title: 'Rendez-vous confirmé — PsyLib',
```

- [ ] **Step 2: Change H1 title for non-paid flow (lines 72-76)**

```typescript
// Before
<>Votre demande a bien<br />été envoyée.</>

// After
<>Votre rendez-vous<br />est confirmé !</>
```

- [ ] **Step 3: Change subtitle for non-paid flow (lines 78-81)**

```typescript
// Before (the non-paid branch)
'Votre demande de rendez-vous a bien été envoyée au praticien.'

// After
'Votre rendez-vous est confirmé. Vous recevrez un rappel avant la séance.'
```

- [ ] **Step 4: Change "prochaine étape" card text (lines 101-104)**

```typescript
// Before
<>Le praticien va confirmer votre rendez-vous dans les <strong>24 à 48 heures</strong>. Vous recevrez un email de confirmation avec toutes les informations pratiques.</>

// After
<>Vous recevrez un rappel par email avant votre séance. En cas d&apos;empêchement, vous pouvez annuler via le lien dans votre email de confirmation.</>
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/psy/[slug]/confirmation/page.tsx
git commit -m "feat(booking): confirmation page reflects auto-confirmed status"
```

---

### Task 5: Frontend — Update success page

**Files:**
- Modify: `apps/web/src/app/psy/[slug]/success/page.tsx:96-104`

- [ ] **Step 1: Change "prochaine étape" non-payment text (lines 96-104)**

```typescript
// Before
<>
  Le praticien va confirmer votre rendez-vous dans les{' '}
  <strong>24 à 48 heures</strong>. Vous recevrez un email de
  confirmation avec toutes les informations pratiques.
</>

// After
<>
  Vous recevrez un rappel par email avant votre séance. En cas
  d&apos;empêchement, vous pouvez annuler via le lien dans votre
  email de confirmation.
</>
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/psy/[slug]/success/page.tsx
git commit -m "feat(booking): success page removes 24-48h wait message"
```

---

### Task 6: Backend — Rewrite patient booking email

**Files:**
- Modify: `apps/api/src/notifications/email.service.ts` (method `sendBookingReceivedToPatient`, ~lines 562-628)

- [ ] **Step 1: Update email subject**

```typescript
// Before
await this.send(to, `Demande de RDV bien reçue — ${data.psychologistName}`, html, 'sendBookingReceivedToPatient');

// After
await this.send(to, `Rendez-vous confirmé — ${data.psychologistName} le ${dateFormatted}`, html, 'sendBookingReceivedToPatient');
```

- [ ] **Step 2: Update email title and badge**

```typescript
// Before
'Demande de RDV reçue',
`<h1>Bonjour ${data.patientName},</h1>
<div class="badge badge-warning">En attente de confirmation</div>

// After
'Rendez-vous confirmé',
`<h1>Bonjour ${data.patientName},</h1>
<div class="badge badge-success">Confirmé</div>
```

- [ ] **Step 3: Update email body text**

```typescript
// Before
'Vous recevrez une confirmation dès que le praticien aura validé le créneau.'

// After
'Votre rendez-vous est confirmé. Vous recevrez un rappel avant la séance.'
```

- [ ] **Step 4: Verify build**

Run: `cd apps/api && npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/notifications/email.service.ts
git commit -m "feat(email): patient booking email says confirmed instead of pending"
```

---

### Task 7: Backend — Rewrite psy notification email

**Files:**
- Modify: `apps/api/src/notifications/email.service.ts` (method `sendBookingRequestToPsy`, ~lines 506-558)

- [ ] **Step 1: Update email title and badge**

```typescript
// Before
'Nouvelle demande de RDV',
`<h1>Nouvelle demande de RDV</h1>
<div class="badge badge-warning">En attente de confirmation</div>

// After
'Nouveau rendez-vous',
`<h1>Nouveau rendez-vous</h1>
<div class="badge badge-success">Confirmé automatiquement</div>
```

- [ ] **Step 2: Update CTA button**

```typescript
// Before
<a href="${data.dashboardUrl}" class="btn">Confirmer ou refuser</a>

// After
<a href="${data.dashboardUrl}" class="btn">Voir dans l&apos;agenda</a>
```

- [ ] **Step 3: Update email subject**

```typescript
// Before
`Nouvelle demande de RDV — ${data.patientName} le ${dateFormatted}`

// After
`Nouveau RDV confirmé — ${data.patientName} le ${dateFormatted}`
```

- [ ] **Step 4: Verify build**

Run: `cd apps/api && npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/notifications/email.service.ts
git commit -m "feat(email): psy notification says confirmed, CTA is view not approve"
```

---

### Task 8: Backend — Send cancellation email to patient when psy cancels

**Files:**
- Modify: `apps/api/src/appointments/appointments.service.ts` (method `cancel`, ~lines 275-334)
- Modify: `apps/api/src/notifications/email.service.ts` (add `sendBookingCancelledToPatient` method)

- [ ] **Step 1: Add `sendBookingCancelledToPatient` method to email service**

Add after the existing `sendBookingDeclined` method in `email.service.ts`:

```typescript
async sendBookingCancelledToPatient(
  to: string,
  data: {
    patientName: string;
    psychologistName: string;
    scheduledAt: Date;
    rebookUrl?: string;
  },
): Promise<void> {
  const dateFormatted = data.scheduledAt.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris',
  });

  const html = emailLayout(
    'Rendez-vous annulé',
    `<h1>Bonjour ${data.patientName},</h1>
    <div class="badge badge-error">Annulé</div>
    <p>Votre rendez-vous avec <strong>${data.psychologistName}</strong> prévu le <strong>${dateFormatted}</strong> a été annulé par le praticien.</p>
    <p>Nous vous invitons à reprendre rendez-vous si vous le souhaitez.</p>
    ${data.rebookUrl ? `<a href="${data.rebookUrl}" class="btn">Reprendre rendez-vous</a>` : ''}
    <p style="color:#6b7280;font-size:13px;">Si vous avez des questions, contactez directement votre praticien.</p>`,
  );

  await this.send(
    to,
    `Rendez-vous annulé — ${data.psychologistName}`,
    html,
    'sendBookingCancelledToPatient',
  );
}
```

- [ ] **Step 2: Call it from `cancel()` method in appointments service**

In `appointments.service.ts`, inside the `cancel` method (after the appointment update and before the return), add patient email notification. Find the section after the `update` call and add:

```typescript
// After the appointment is cancelled, notify patient by email
if (existing.source === 'public') {
  const patient = await this.prisma.patient.findUnique({
    where: { id: existing.patientId! },
    select: { name: true, email: true },
  });
  if (patient?.email) {
    const psyRecord = await this.prisma.psychologist.findUnique({
      where: { id: psy.id },
      select: { name: true, slug: true },
    });
    void this.email.sendBookingCancelledToPatient(patient.email, {
      patientName: patient.name,
      psychologistName: psyRecord?.name ?? psy.name,
      scheduledAt: existing.scheduledAt,
      rebookUrl: psyRecord?.slug
        ? `${process.env.FRONTEND_URL || 'https://psylib.eu'}/psy/${psyRecord.slug}`
        : undefined,
    }).catch((err) => this.logger.warn(`Cancel email failed: ${(err as Error).message}`));
  }
}
```

- [ ] **Step 3: Also fix `declineAppointment` — add `cancelledBy` field (line 390)**

```typescript
// Before
data: { status: 'cancelled' },

// After
data: { status: 'cancelled', cancelledBy: 'psychologist' },
```

- [ ] **Step 4: Verify build**

Run: `cd apps/api && npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/notifications/email.service.ts apps/api/src/appointments/appointments.service.ts
git commit -m "feat(booking): send cancellation email to patient when psy cancels public booking"
```

---

### Task 9: Final verification and deploy

- [ ] **Step 1: Full build check**

```bash
cd apps/api && npx tsc --noEmit && cd ../web && npx tsc --noEmit
```

- [ ] **Step 2: Verify all changes**

```bash
git log --oneline -8
```

Expected: 7 new commits for tasks 1-8.

- [ ] **Step 3: Deploy to Vercel**

```bash
cd /c/Users/tonyr/OneDrive/Projet/PsyFlow && npx vercel --prod --yes
```

- [ ] **Step 4: Deploy to VPS**

Follow standard VPS deploy procedure (tar + scp + docker build + migrate).
