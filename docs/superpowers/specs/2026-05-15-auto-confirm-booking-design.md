# Auto-Confirm Booking — Design Spec

**Date:** 2026-05-15
**Status:** Approved

## Problem

The current public booking flow misleads patients:
- Confirmation page says "Votre demande a bien été envoyée" → implies it's not confirmed
- Says "Le praticien va confirmer sous 24-48h" → creates unnecessary uncertainty
- Submit button says "Envoyer ma demande" → sounds like a request, not a reservation
- Footer says "Votre demande sera confirmée par le praticien" → false expectation of manual approval

In reality, the slot is already blocked and the appointment exists — the messaging is just wrong.

## Solution

Switch to Doctolib-style auto-confirmation:
1. Public bookings create appointments in `confirmed` status (not `scheduled`)
2. All patient-facing text reflects immediate confirmation
3. Psy receives notification email with quick cancel link
4. When psy cancels a public booking, patient is notified by email

## Scope

- **Public bookings only** — psy-created appointments (via SmartSlotPickerDialog, `source: 'internal'`) remain `scheduled` as before
- **Existing `scheduled` public appointments** — left as-is, psys handle them normally. No migration needed.
- `confirmAppointment()` and `declineAppointment()` endpoints remain functional for backward compat (old `scheduled` appointments)

## Changes

### 1. Backend — `apps/api/src/public-booking/public-booking.service.ts`

Change appointment creation status from `'scheduled'` to `'confirmed'` for public bookings.

### 2. Backend — `apps/api/src/billing/subscription.service.ts`

The Stripe webhook handler currently overrides status to `'scheduled'` after successful payment. Change to `'confirmed'` so paid bookings stay confirmed.

### 3. Frontend — `apps/web/src/app/psy/[slug]/public-profile-client.tsx` (BookingModal)

| Element | Before | After |
|---|---|---|
| Modal title | "Confirmer la demande" | "Réserver un rendez-vous" |
| Submit button (no payment) | "Envoyer ma demande" | "Réserver" |
| Footer (no payment) | "Aucun compte requis · Votre demande sera confirmée par le praticien" | "Aucun compte requis · Confirmation immédiate" |

### 4. Frontend — `apps/web/src/app/psy/[slug]/confirmation/page.tsx`

| Element | Before | After |
|---|---|---|
| Metadata title | "Demande envoyée - PsyLib" | "Rendez-vous confirmé - PsyLib" |
| Title | "Votre demande a bien été envoyée." | "Votre rendez-vous est confirmé !" |
| Body (prochaine étape) | "Le praticien va confirmer votre rendez-vous dans les **24 à 48 heures**." | "Vous recevrez un rappel par email avant votre séance." |

### 5. Frontend — `apps/web/src/app/psy/[slug]/success/page.tsx`

This page also has "24-48h" text for non-payment case. Update:

| Element | Before | After |
|---|---|---|
| Body (non-payment) | "Le praticien va confirmer votre rendez-vous dans les 24 à 48 heures." | "Vous recevrez un rappel par email avant votre séance." |

### 6. Emails — `apps/api/src/notifications/email.service.ts`

**Patient email (`sendBookingReceivedToPatient`):**

| Element | Before | After |
|---|---|---|
| Subject | "Demande de RDV bien reçue" | "Rendez-vous confirmé — [date] à [heure]" |
| Title badge | "En attente de confirmation" | "Confirmé" |
| Body text | "Vous recevrez une confirmation dès que le praticien aura validé le créneau" | "Votre rendez-vous est confirmé. Vous recevrez un rappel avant la séance." |

**Psy email (`sendBookingRequestToPsy`):**

| Element | Before | After |
|---|---|---|
| Subject | "Nouvelle demande de RDV" | "Nouveau rendez-vous — [patient] le [date]" |
| Title badge | "En attente de confirmation" | "Confirmé" |
| Button text | "Confirmer ou refuser" | "Voir dans l'agenda" |
| Additional | — | Add "Annuler ce rendez-vous" link to dashboard/calendar |

### 7. Cancellation notification — `apps/api/src/appointments/appointments.service.ts`

When a psy cancels a confirmed public booking (via `cancel()` or `declineAppointment()`):
- Send email to patient: "Votre rendez-vous du [date] a été annulé par le praticien"
- Include booking page link so patient can rebook
- Use existing dashboard link for the psy's cancel action (no new deep-link endpoint needed)

## Files Impacted

1. `apps/api/src/public-booking/public-booking.service.ts` — status `scheduled` → `confirmed`
2. `apps/api/src/billing/subscription.service.ts` — Stripe webhook: status `scheduled` → `confirmed`
3. `apps/web/src/app/psy/[slug]/public-profile-client.tsx` — modal texts
4. `apps/web/src/app/psy/[slug]/confirmation/page.tsx` — confirmation texts + metadata title
5. `apps/web/src/app/psy/[slug]/success/page.tsx` — success page texts (non-payment case)
6. `apps/api/src/notifications/email.service.ts` — patient + psy email templates rewrite
7. `apps/api/src/appointments/appointments.service.ts` — cancellation email to patient

## Out of Scope

- Slot picker redesign (kept as-is)
- Configurable auto-confirm vs manual mode
- New UI components
- Migration of existing `scheduled` public appointments
- Removing `confirmAppointment()`/`declineAppointment()` endpoints
