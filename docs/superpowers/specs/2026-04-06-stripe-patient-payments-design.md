# Stripe Patient Payments — Design Spec

**Date:** 2026-04-06
**Status:** Approved
**Scope:** Paiement en ligne des séances par les patients (prépaiement + post-séance), page publique de réservation, remboursements configurables

---

## 1. Contexte & Objectif

Les psychologues utilisant PsyScale veulent encaisser les paiements de leurs patients en ligne — soit au moment de la réservation (prépaiement), soit après la séance (lien de paiement). Cette feature est un argument de vente fort (comparable à Doctolib) et est réservée aux plans Pro et Clinic (Scale).

**Ce qui existe déjà (backend) :**
- Stripe Connect Express : `createConnectedAccount()`, `createAccountLink()`, `getAccountStatus()`
- Booking checkout : `createBookingCheckoutSession()` (one-time payment, transfer to psy)
- Webhook handlers : `handleBookingPaymentCompleted()`, `handleAccountUpdated()`
- Idempotency : table `stripe_events`
- Prisma fields : `paymentIntentId`, `paidOnline`, `bookingPaymentStatus` sur appointments
- Prisma fields : `stripeAccountId`, `stripeOnboardingComplete`, `allowOnlinePayment` sur psychologists
- **Modèle `Availability`** : déjà en place avec `id`, `psychologistId`, `dayOfWeek`, `startTime`, `endTime`, `isActive`
- **`AvailabilityService`** : `getSlots()`, `saveSlots()`, `deleteSlot()`, `getAvailableTimeslots()`
- **`AvailabilityController`** : `GET /availability`, `POST /availability`, `DELETE /availability/:id`
- **`PublicBookingService`** : `bookAppointment()` avec Stripe checkout, création patient, détection conflits, ghost cleanup
- **`PublicBookingController`** : `GET /public/psy/:slug/slots`, `POST /public/psy/:slug/book`
- **`cancelToken`** : généré par `bookAppointment()` et stocké sur l'appointment

**Ce qui manque :**
- Frontend UI pour tout le flow (settings paiements, page publique, dashboard paiements)
- Lien de paiement post-séance
- Remboursements (auto + manuels) + méthode `createRefund()` dans `StripeService`
- Endpoints d'annulation par token (`GET/POST /appointments/cancel/:token`)
- Email de confirmation incluant le lien d'annulation (cancelToken)
- Feature gate Pro/Clinic côté UI
- Dashboard paiements

---

## 2. Feature Gate

- **Plans Pro (`pro`) et Clinic (`clinic`)** : accès complet aux paiements en ligne
- **Plans Free (`free`) et Starter (`starter`)** : page `/settings/payments` affiche un upsell card "Passez au plan Pro"
- Le backend vérifie `subscription.plan` avant de créer un checkout ou payment-link
- Guard NestJS : `@RequirePlan(SubscriptionPlan.PRO, SubscriptionPlan.CLINIC)` sur les endpoints de paiement patient

---

## 3. Stripe Connect Onboarding (Psy)

### Page `/settings/payments`

**Si plan < Pro :**
- Card upsell : "Activez les paiements en ligne — Plan Pro requis" + bouton "Voir les plans"

**Si plan >= Pro, pas encore onboardé :**
- Card onboarding : "Connectez votre compte bancaire pour recevoir des paiements"
- Bouton "Connecter mon compte" → `POST /billing/connect/onboard` → redirect Stripe Express
- Retour : `GET /billing/connect/status` → affiche statut (en attente / vérifié / actif)

**Si onboardé :**
- Statut Stripe Connect : badge vert "Compte actif"
- Configuration paiements :
  - **Mode de paiement** : radio group
    - "Prépaiement à la réservation" (le patient paie pour confirmer le RDV)
    - "Paiement après séance" (le psy envoie un lien)
    - "Les deux" (par défaut)
  - **Tarif par défaut** : input numérique, pré-rempli depuis `defaultSessionRate`
  - **Politique d'annulation** :
    - Délai : dropdown 24h / 48h / 72h
    - Remboursement : toggle "Remboursement automatique si annulé dans le délai"

### Nouveaux champs Prisma — `psychologists`

```prisma
paymentMode       PaymentMode @default(both)     // prepaid | postpaid | both
cancellationDelay Int         @default(24)        // heures avant RDV
autoRefund        Boolean     @default(true)      // remboursement auto dans le délai
```

```prisma
enum PaymentMode {
  prepaid
  postpaid
  both
}
```

### Endpoints existants utilisés
- `POST /billing/connect/onboard` — déjà implémenté
- `GET /billing/connect/status` — déjà implémenté

### Nouvel endpoint
- `PUT /billing/connect/settings` — sauvegarde paymentMode, cancellationDelay, autoRefund
  - Body : `{ paymentMode, cancellationDelay, autoRefund, defaultSessionRate }`
  - Valide que le psy est onboardé Stripe Connect
  - Met à jour le profil psychologist

---

## 4. Système de Disponibilités (EXISTANT)

> Le modèle `Availability` et les services associés existent déjà. Cette section documente l'existant et les ajustements nécessaires.

### Modèle Prisma existant — `Availability`

```prisma
model Availability {
  id             String       @id @default(uuid()) @db.Uuid
  psychologistId String       @db.Uuid
  psychologist   Psychologist @relation(fields: [psychologistId], references: [id])
  dayOfWeek      Int          // 0=lundi, ..., 6=dimanche
  startTime      String       // "09:00"
  endTime        String       // "17:00"
  isActive       Boolean      @default(true)
}
```

> Note : la durée des créneaux est déjà gérée via `defaultSessionDuration` sur le psychologist et `ConsultationType.duration`.

### Page `/settings/availability` (ou section dans `/settings/payments`)

- Grille semaine : chaque jour a une ou plusieurs plages horaires
- Bouton "Ajouter une plage" par jour
- Chaque plage : heure début, heure fin
- Toggle actif/inactif par plage

### Endpoints existants

```
GET    /availability             — Liste des plages du psy connecté (existant)
POST   /availability             — Créer/sauvegarder des plages (existant)
DELETE /availability/:id         — Supprimer une plage (existant)
```

### Endpoint à ajouter
```
PUT    /availability/:id         — Modifier une plage individuelle (nouveau)
```

### Calcul des créneaux libres (endpoint public existant)

```
GET /public/psy/:slug/slots      — Déjà implémenté dans PublicBookingController
```

Logique existante dans `AvailabilityService.getAvailableTimeslots()` :
1. Récupérer les plages horaires actives du psy
2. Générer tous les créneaux possibles selon la durée de consultation
3. Soustraire les appointments existants (status != cancelled)
4. Retourner les créneaux disponibles par jour

---

## 5. Page Publique de Réservation — `/psy/[slug]`

### Layout

Page SSR Next.js (SEO-friendly), pas d'authentification requise.

> Note : La page frontend est `/psy/[slug]` mais les appels API utilisent le préfixe `/public/psy/:slug` (routes existantes dans `PublicBookingController`).

**Header :**
- Avatar du psy (ou initiales)
- Nom complet
- Spécialité
- Numéro ADELI (gage de confiance)
- Courte bio (optionnelle)

**Calendrier :**
- Vue semaine (navigation semaine précédente/suivante)
- Créneaux disponibles affichés comme boutons cliquables (via `GET /public/psy/:slug/slots`)
- Créneau sélectionné = mis en surbrillance

**Formulaire de réservation (après sélection créneau) :**
- Prénom + Nom (obligatoire)
- Email (obligatoire)
- Téléphone (optionnel)
- Motif de consultation (optionnel, textarea)
- Case RGPD : "J'accepte que mes données soient traitées..."

**Après soumission (`POST /public/psy/:slug/book` — existant) :**
- **Si prépaiement actif** (`paymentMode = prepaid | both`) :
  - Redirect vers Stripe Checkout (montant = `defaultSessionRate`)
  - Stripe Checkout success → webhook → appointment mis à jour avec `bookingPaymentStatus = paid`, `status = scheduled`
  - Note : le webhook existant `handleBookingPaymentCompleted` set `status: 'scheduled'` — on pourra ajuster à `'confirmed'` si souhaité
  - Page succès : récap RDV + politique d'annulation + lien d'annulation par email
- **Si prépaiement désactivé** (`paymentMode = postpaid`) :
  - Appointment créé avec `bookingPaymentStatus = none`, `status = scheduled`
  - Email de confirmation envoyé au patient
  - Le psy voit le RDV dans ses pending appointments

### Anti-spam
- Rate limiting : 5 réservations / heure / IP
- Honeypot field dans le formulaire
- Validation email format + Zod

### Patient existant vs nouveau
- Si l'email correspond à un patient existant du psy → associer (déjà géré par `PublicBookingService`)
- Sinon → créer un nouveau patient (source: "online") (déjà géré)

### Double-booking (race condition)
- La vérification de conflit existe dans `bookAppointment()` (optimistic check)
- Le ghost cleanup cron (35min) nettoie les appointments non payés
- **MVP** : cette approche est suffisante. En v2, ajouter un advisory lock DB ou contrainte unique `(psychologistId, scheduledAt)` pour garantir l'unicité au niveau DB.

---

## 6. Paiement Post-Séance (Lien de Paiement)

### Flow

```
Psy ouvre un RDV/séance avec paymentStatus = pending
  → Bouton "Envoyer lien de paiement"
  → POST /billing/payment-link { appointmentId, amount? }
  → Backend crée Stripe Checkout Session (one-time, transfer to psy)
  → Email envoyé au patient avec lien + récap
  → Patient clique → paie → webhook → statut mis à jour
```

### Nouvel endpoint

```
POST /billing/payment-link
Body: {
  appointmentId?: string    // OU sessionId
  sessionId?: string
  amount?: number           // override le tarif par défaut
}
Response: {
  checkoutUrl: string
  paymentId: string
}
```

- Crée un record `payments` (type: session, status: pending) avec `appointmentId` FK
- Crée un Stripe Checkout Session avec `payment_intent_data.transfer_data` vers le compte du psy
- Envoie un email au patient via `EmailService`
- Le webhook `checkout.session.completed` met à jour `payments.status = paid` + `appointment.bookingPaymentStatus = paid`

### Nouveaux champs Prisma — `payments`

```prisma
stripeCheckoutSessionId String? @unique
appointmentId           String? @db.Uuid
appointment             Appointment? @relation(fields: [appointmentId], references: [id])
```

> Le `appointmentId` FK est nécessaire pour :
> - Lier le payment à l'appointment dans le flow payment-link
> - Retrouver le payment à rembourser via `appointmentId`
> - Afficher "Voir le RDV" dans le dashboard paiements

### UI côté psy

**Sur la fiche RDV / séance :**
- Badge statut paiement : "En attente" (jaune), "Payé en ligne" (vert), "Payé sur place" (gris), "Lien envoyé" (bleu), "Échoué" (rouge), "Remboursé" (orange)
- Bouton "Envoyer lien de paiement" (si pending + psy a Stripe Connect)
- Bouton "Marquer payé sur place" (met `paymentStatus = paid` + `paidOnline = false`)
- Bouton "Rembourser" (si payé en ligne)

---

## 7. Remboursements & Annulations

### Annulation par le patient

**Endpoints (entièrement nouveaux) :**
```
GET  /appointments/cancel/:cancelToken  — Récap du RDV (public, pas d'auth)
POST /appointments/cancel/:cancelToken  — Confirmer l'annulation
```

> Note : le `cancelToken` est déjà généré par `bookAppointment()` mais n'est actuellement pas inclus dans l'email de confirmation. L'email de booking doit être mis à jour pour inclure le lien `{FRONTEND_URL}/appointments/cancel/{cancelToken}`.

**Page `/appointments/cancel/[cancelToken]` (nouveau) :**
- Affiche le récap du RDV (date, heure, psy)
- Bouton "Confirmer l'annulation"
- Logique :
  - Si `scheduledAt - now() > cancellationDelay` heures :
    - Si `autoRefund = true` ET `paidOnline = true` → Stripe Refund auto + email confirmation
    - Si `autoRefund = false` → appointment annulé, psy notifié pour décider
  - Si hors délai :
    - Message "Annulation tardive — contactez votre psychologue directement"
    - Appointment annulé, pas de remboursement auto

### Remboursement manuel (psy)

**Bouton "Rembourser" sur les paiements en ligne :**
- Confirmation dialog : "Rembourser X€ à [patient] ?"
- `POST /billing/refund { appointmentId }`
- Backend : `StripeService.createRefund(paymentIntentId)` → met à jour `bookingPaymentStatus = refunded` + `payments.status = refunded`

### Nouvelle méthode StripeService

```typescript
async createRefund(paymentIntentId: string): Promise<Stripe.Refund> {
  return this.stripe.refunds.create({ payment_intent: paymentIntentId });
}
```

### Nouveaux statuts enum

```prisma
enum BookingPaymentStatus {
  none
  pending_payment
  paid
  payment_failed
  refunded          // nouveau
}

enum PaymentStatus {
  pending
  paid
  failed
  refunded          // nouveau
}
```

### Nouveaux endpoints

```
POST /billing/refund
Body: { appointmentId: string }
→ Stripe Refund → update bookingPaymentStatus = refunded + payments.status = refunded
```

---

## 8. Dashboard Paiements — `/payments`

### Layout

Nouvelle page dans le dashboard psy.

**KPIs (haut de page) :**
- Total encaissé ce mois (€)
- En attente de paiement (€)
- Nombre de transactions
- Taux de paiement en ligne (%)

**Liste des paiements :**
- Colonnes : Date, Patient, Montant, Mode (en ligne / sur place), Statut, Actions
- Filtres : période (date range), statut, mode
- Pagination standard (in-card)

**Actions par paiement :**
- "Voir le RDV" → lien vers appointment (via `appointmentId` FK)
- "Rembourser" (si payé en ligne)
- "Envoyer reçu" (futur — out of scope MVP)

### Endpoint API

```
GET /payments
Query: { from?, to?, status?, mode?, page?, limit? }
→ Liste paginée des payments du psy
```

### Intégration fiche patient

Section "Paiements" dans `/patients/[id]` :
- Liste des paiements de ce patient
- Total payé, solde en attente

---

## 9. Emails Transactionnels

| Événement | Destinataire | Contenu |
|---|---|---|
| RDV réservé (prépaiement) | Patient | Confirmation + récap + **lien annulation** (`cancelToken`) |
| RDV réservé (sans prépaiement) | Patient | Confirmation + récap + **lien annulation** (`cancelToken`) |
| RDV réservé | Psy | Notification nouveau RDV |
| Lien de paiement | Patient | Montant + lien Stripe + récap séance |
| Paiement reçu | Psy | Notification paiement reçu |
| Remboursement effectué | Patient | Confirmation remboursement |
| Annulation patient | Psy | Notification annulation + statut remboursement |

> Important : l'email de confirmation de booking DOIT inclure le lien d'annulation sous la forme `{FRONTEND_URL}/appointments/cancel/{cancelToken}`. C'est le seul moyen pour le patient d'annuler.

---

## 10. Modifications Prisma — Résumé

### Pas de nouveaux modèles
- Le modèle `Availability` existe déjà

### Modifications modèles existants
- `Psychologist` : + `paymentMode` (enum), `cancellationDelay` (Int, default 24), `autoRefund` (Boolean, default true)
- `Payment` : + `stripeCheckoutSessionId` (String? @unique), + `appointmentId` (String? FK → Appointment)
- `BookingPaymentStatus` enum : + `refunded`
- `PaymentStatus` enum : + `refunded`

### Nouveau enum
```prisma
enum PaymentMode {
  prepaid
  postpaid
  both
}
```

### Nouveaux index
```sql
CREATE INDEX idx_payments_psy_date ON payments(psychologist_id, created_at DESC);
CREATE INDEX idx_payments_patient ON payments(patient_id);
CREATE INDEX idx_payments_appointment ON payments(appointment_id);
```

---

## 11. Endpoints API — Résumé

### Nouveaux endpoints
| Method | Route | Auth | Description |
|---|---|---|---|
| PUT | `/billing/connect/settings` | Psy | Config paiements (mode, annulation) |
| POST | `/billing/payment-link` | Psy | Envoyer lien paiement post-séance |
| POST | `/billing/refund` | Psy | Remboursement manuel |
| PUT | `/availability/:id` | Psy | Modifier une plage horaire |
| GET | `/appointments/cancel/:token` | Public | Récap RDV pour annulation |
| POST | `/appointments/cancel/:token` | Public | Confirmer annulation |
| GET | `/payments` | Psy | Dashboard paiements |

### Endpoints existants réutilisés
- `POST /billing/connect/onboard` — Stripe Connect onboarding
- `GET /billing/connect/status` — Statut Stripe Connect
- `POST /billing/webhooks/stripe` — enrichi avec `charge.refunded` event type
- `GET /availability` — Plages horaires du psy
- `POST /availability` — Créer/sauvegarder des plages
- `DELETE /availability/:id` — Supprimer une plage
- `GET /public/psy/:slug/slots` — Créneaux libres (public)
- `POST /public/psy/:slug/book` — Réserver un créneau (public)

---

## 12. Pages Frontend — Résumé

| Page | Type | Description |
|---|---|---|
| `/settings/payments` | Dashboard psy | Onboarding Stripe + config |
| `/settings/availability` | Dashboard psy | Gestion plages horaires |
| `/payments` | Dashboard psy | Dashboard paiements |
| `/psy/[slug]` | Publique SSR | Page réservation patient |
| `/psy/[slug]/success` | Publique | Confirmation réservation |
| `/appointments/cancel/[token]` | Publique | Annulation RDV patient |

> Note : les pages frontend `/psy/[slug]` appellent les API backend via `/public/psy/:slug/*`.

---

## 13. Sécurité & Conformité

- **Pas de données patient dans Stripe metadata** : seulement `appointmentId`, `psychologistId`
- **Webhook signature validation** : déjà implémentée
- **Idempotency** : déjà via table `stripe_events`
- **Rate limiting page publique** : 5 réservations/heure/IP
- **RGPD** : consentement explicite sur le formulaire de réservation
- **Multi-tenant** : tous les endpoints filtrés par `psychologistId`
- **Audit logs** : `PAYMENT_CREATED`, `PAYMENT_REFUNDED`, `APPOINTMENT_BOOKED_ONLINE`

---

## 14. Out of Scope (futur)

- Facturation PDF automatique après paiement
- Rappel de paiement automatique (relance email)
- Paiement en plusieurs fois
- Types de consultation avec tarifs différents sur la page publique
- Intégration Google Calendar / iCal
- Acompte partiel (ex: 30% à la réservation)
- Advisory lock DB pour anti-double-booking (v2)
