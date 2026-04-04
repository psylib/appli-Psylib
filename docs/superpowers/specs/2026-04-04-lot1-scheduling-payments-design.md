# Lot 1 — Types de séances, Mon Soutien Psy, paiement au booking, liste d'attente, rappels SMS

**Date :** 2026-04-04
**Statut :** En attente d'approbation
**Scope :** Backend (NestJS) + Frontend (Next.js) + DB (Prisma/PostgreSQL)

---

## Contexte

PsyLib manque de fonctionnalités basiques que tous les concurrents (Doctolib, Docorga, Terapiz, Perfactive) proposent. Ce lot comble les lacunes critiques avant le lancement commercial.

**Analyse concurrentielle :**
- Aucun concurrent ne gère nativement Mon Soutien Psy (12 séances/an, 50€)
- Les rappels SMS réduisent les no-shows de ~60% (source : Docorga)
- La liste d'attente est présente chez Doctolib, Docorga, Deiz, Perfactive
- Le paiement au booking n'existe que pour la téléconsultation chez Doctolib

---

## 1. Motifs de consultation (consultation_types)

### Objectif
Permettre au psychologue de configurer des types de rendez-vous avec durée, tarif et catégorie distincts. Le patient choisit le motif au booking, le planning s'adapte.

### Modèle de données

```prisma
model ConsultationType {
  id              String   @id @default(uuid())
  psychologistId  String   @map("psychologist_id")
  name            String   // "Séance individuelle", "Mon Soutien Psy - Évaluation"
  duration        Int      // minutes (30, 45, 60, 90...)
  rate            Decimal  @db.Decimal(10, 2) // tarif en €
  color           String   @default("#3D52A0") // couleur agenda hex
  category        ConsultationCategory @default(standard)
  isPublic        Boolean  @default(true) @map("is_public") // visible sur booking public
  isActive        Boolean  @default(true) @map("is_active")
  sortOrder       Int      @default(0) @map("sort_order")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  psychologist    Psychologist @relation(fields: [psychologistId], references: [id], onDelete: Cascade)
  appointments    Appointment[]
  waitlistEntries WaitlistEntry[]

  @@index([psychologistId], name: "idx_consultation_types_psy")
  @@map("consultation_types")
}

enum ConsultationCategory {
  standard          // Séance classique (tarif libre, durée libre)
  mon_soutien_psy   // Mon Soutien Psy (tarif bloqué 50€)
}
```

### Modification de Appointment

```prisma
model Appointment {
  // ... champs existants
  consultationTypeId  String?  @map("consultation_type_id")
  consultationType    ConsultationType? @relation(fields: [consultationTypeId], references: [id])
  paymentIntentId     String?  @map("payment_intent_id") // Stripe, si paiement au booking
  paidOnline          Boolean  @default(false) @map("paid_online")
  paymentStatus       BookingPaymentStatus @default(none) @map("booking_payment_status")
  createdAt           DateTime @default(now()) @map("created_at")

  @@index([consultationTypeId], name: "idx_appointments_consultation_type")
}

enum BookingPaymentStatus {
  none              // Pas de paiement en ligne
  pending_payment   // En attente de paiement Stripe (créneau réservé 30min)
  paid              // Payé en ligne
  payment_failed    // Paiement échoué ou expiré
}
```

**Gestion des créneaux fantômes :** Quand un patient choisit "Payer en ligne", l'appointment est créé avec `paymentStatus: pending_payment`. Un cron toutes les 5 minutes vérifie les appointments `pending_payment` créés depuis plus de 35 minutes sans paiement → les passe en `payment_failed` et `status: cancelled`, libérant le créneau.

### Modification de PublicBookingDto

```typescript
// Le DTO de booking public est étendu :
PublicBookingDto {
  // ... champs existants (patientName, patientEmail, patientPhone, scheduledAt, reason)
  consultationTypeId: string  // REQUIS — motif de consultation choisi
  payOnline?: boolean         // Optionnel — true si le patient veut payer en ligne
}
```

Le `duration` de l'appointment est déduit du `consultationType.duration` (pas envoyé par le client). Le conflict check utilise cette durée.

### Motifs pré-créés à l'onboarding

Quand un psy termine l'onboarding, un motif par défaut est créé :

| Nom | Durée | Tarif | Catégorie | Public |
|-----|-------|-------|-----------|--------|
| Séance individuelle | 60 min | (tarif du psy) | standard | oui |

Les motifs Mon Soutien Psy sont créés **uniquement quand le psy active MSP** dans ses settings (`acceptsMonSoutienPsy = true`). À ce moment, 2 motifs sont auto-créés :

| Nom | Dur��e | Tarif | Catégorie | Public |
|-----|-------|-------|-----------|--------|
| Mon Soutien Psy - Évaluation | 45 min | 50.00€ | mon_soutien_psy | oui |
| Mon Soutien Psy - Suivi | 45 min | 50.00€ | mon_soutien_psy | oui |

Les motifs MSP ont le tarif bloqué �� 50€ côté API (le psy ne peut pas le modifier). Si le psy désactive MSP, les motifs passent en `isActive: false` mais ne sont pas supprimés (les appointments historiques gardent leur référence).

### API

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/consultation-types` | Liste des motifs du psy (auth) |
| POST | `/consultation-types` | Créer un motif |
| PUT | `/consultation-types/:id` | Modifier un motif |
| PATCH | `/consultation-types/:id/deactivate` | Désactiver un motif (soft delete) |
| GET | `/public/psy/:slug/consultation-types` | Motifs publics actifs (no auth) |

**Validation :**
- `name` : 2–100 caractères, requis
- `duration` : 5–480 minutes, requis
- `rate` : >= 0, requis
- `color` : format hex (#XXXXXX)
- Si `category = mon_soutien_psy` → `rate` forcé à 50.00 côté service (ignoré si envoyé)
- Max 20 motifs par psy (éviter abus)

### Frontend

**Page `/dashboard/settings/practice`** (existante) — ajouter une section "Motifs de consultation" :
- Liste des motifs avec drag-and-drop pour réordonner
- Formulaire d'ajout/édition en modal
- Toggle actif/inactif
- Toggle "Visible en booking public"
- Preview couleur dans l'agenda

**Page booking publique `/psy/[slug]`** — adapter :
- Étape 1 : choix du motif (cards avec nom + durée + tarif)
- Étape 2 : choix du créneau (slots générés selon la durée du motif)
- Étape 3 : formulaire patient + option paiement

### Impact sur le slot algorithm

`AvailabilityService.getAvailableTimeslots()` reçoit maintenant la durée du motif choisi au lieu de `defaultSessionDuration`. Le pas de génération des créneaux = durée du motif.

**Exemple :** Motif "Séance individuelle" (60min), disponibilité 9h–18h :
→ Créneaux : 9:00, 10:00, 11:00, 12:00, 13:00, 14:00, 15:00, 16:00, 17:00

**Exemple :** Motif "Mon Soutien Psy" (45min), disponibilité 9h–18h :
→ Créneaux : 9:00, 9:45, 10:30, 11:15, 12:00, 12:45, 13:30, 14:15, 15:00, 15:45, 16:30, 17:15

**Conflits :** un créneau est exclu si [start, start+duration] chevauche un appointment existant (quel que soit son motif/durée).

---

## 2. Mon Soutien Psy — Gestion complète

### Objectif
Gérer le dispositif étatique : 12 séances/an, tarif 50€, compteur par patient, alertes quota.

### Modèle de données

```prisma
model MonSoutienPsyTracking {
  id              String   @id @default(uuid())
  psychologistId  String   @map("psychologist_id")
  patientId       String   @map("patient_id")
  year            Int      // Année civile (2026)
  sessionsUsed    Int      @default(0) @map("sessions_used")
  maxSessions     Int      @default(12) @map("max_sessions")
  firstSessionAt  DateTime? @map("first_session_at") // Date 1ère séance (évaluation)
  lastSessionAt   DateTime? @map("last_session_at")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  psychologist    Psychologist @relation(fields: [psychologistId], references: [id], onDelete: Cascade)
  patient         Patient @relation(fields: [patientId], references: [id], onDelete: Cascade)

  @@unique([psychologistId, patientId, year])
  @@index([psychologistId, year], name: "idx_msp_psy_year")
  @@map("mon_soutien_psy_tracking")
}
```

### Source de vérité MSP

Le champ `acceptsMonPsy` existe déjà sur `PsyNetworkProfile`. On le **renomme** en `acceptsMonSoutienPsy` via une migration (le dispositif a été renommé "Mon Soutien Psy" en 2024). **Pas de nouveau champ sur `Psychologist`** — `PsyNetworkProfile` reste la source unique.

```prisma
model PsyNetworkProfile {
  // ... champs existants
  acceptsMonSoutienPsy  Boolean @default(false) @map("accepts_mon_soutien_psy") // renommé depuis acceptsMonPsy
}
```

Le frontend `public-profile-client.tsx` doit aussi être mis à jour : changer "8 séances" en "12 séances" pour refléter l'évolution du dispositif.

### Logique métier

**Compteur MSP — incrémenté à la création de Session (post-consultation), pas au booking :**
1. Quand une `Session` est créée et que son appointment lié (`session → appointment → consultationType`) a `category = mon_soutien_psy` :
2. Upsert `MonSoutienPsyTracking` pour (psy, patient, année courante)
3. Incrémenter `sessionsUsed`
4. Si `sessionsUsed == 1` �� marquer `firstSessionAt` (séance d'évaluation)
5. Mettre à jour `lastSessionAt`
6. Si une session MSP est **supprimée** → décrémenter `sessionsUsed`
7. L'annulation d'un **appointment** n'affecte PAS le compteur (pas de session créée)

**Alertes :**
- `sessionsUsed >= 10` → notification "Patient X a utilisé 10/12 séances Mon Soutien Psy"
- `sessionsUsed >= 12` → notification "Patient X a atteint le quota Mon Soutien Psy pour l'année"
- 1er janvier → cron reset des compteurs (ou plutôt : nouveau tracking pour la nouvelle année)

**Validation au booking :**
- Si le patient a déjà 12 séances MSP cette année → bloquer le booking MSP avec message explicatif
- Afficher le compteur sur la fiche patient : "Mon Soutien Psy : 7/12 séances utilisées en 2026"

### API

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/mon-soutien-psy/patients/:patientId` | Compteur MSP d'un patient (année courante) |
| GET | `/mon-soutien-psy/overview` | Vue d'ensemble tous patients MSP du psy |
| GET | `/mon-soutien-psy/patients/:patientId/history` | Historique par année |

### Frontend

**Fiche patient** — nouvelle section "Mon Soutien Psy" :
- Barre de progression visuelle : 7/12 séances
- Liste des séances MSP de l'année
- Badge couleur : vert (<8), orange (10-11), rouge (12)

**Dashboard** — widget "Mon Soutien Psy" :
- Nombre total de patients MSP actifs
- Patients proches du quota (>= 10 séances)

**Page booking publique** — si le psy accepte MSP :
- Badge "Conventionné Mon Soutien Psy" avec icône officielle
- Motifs MSP avec mention "Remboursé par l'Assurance Maladie"

---

## 3. Paiement en ligne au booking

### Objectif
Permettre au patient de payer en ligne au moment de la réservation. Choix donné au patient : "Payer maintenant" ou "Payer au cabinet".

### Prérequis — Stripe Connect Express

Sans Stripe Connect, les paiements iraient sur le compte Stripe de **PsyLib** (la plateforme), pas du psychologue. Pour que l'argent aille directement au psy, on utilise **Stripe Connect Express**.

**Onboarding Stripe Connect :**
1. Le psy clique "Activer le paiement en ligne" dans ses settings
2. PsyLib crée un Stripe Connected Account (`type: 'express'`)
3. Le psy est redirigé vers le formulaire Stripe Express (KYC, IBAN, identité)
4. Une fois validé, `stripeAccountId` est enregistré sur le profil
5. Le psy peut maintenant recevoir des paiements de ses patients

### Flow

```
Patient choisit motif + créneau
        ↓
  Formulaire de booking
        ↓
  ┌─── Psy a un stripeAccountId ? ────────┐
  │ OUI                                    │ NON
  ↓                                        ↓
  Radio: "Payer maintenant (CB)"           Booking direct
         "Payer au cabinet"                (comme aujourd'hui)
  ↓
  Si "Payer maintenant" :
  → Appointment créé avec paymentStatus: 'pending_payment' (créneau réservé 30min)
  → Stripe Checkout Session (destination: psy.stripeAccountId)
  → success_url = /psy/{slug}/booking-confirmed?session_id=X
  → Webhook: checkout.session.completed → paymentStatus: 'paid'
  → Cron 5min : annule les pending_payment > 35min non payés

  Si "Payer au cabinet" :
  → Booking direct (comme aujourd'hui)
  → paymentStatus: 'none'
```

### Modification de Psychologist settings

```prisma
model Psychologist {
  // ... champs existants
  allowOnlinePayment    Boolean @default(false) @map("allow_online_payment")
  stripeAccountId       String? @unique @map("stripe_account_id") // Stripe Connect Express
  stripeOnboardingComplete Boolean @default(false) @map("stripe_onboarding_complete")
}
```

### API

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/billing/connect/onboard` | Créer Stripe Express account + URL onboarding |
| GET | `/billing/connect/status` | Vérifier statut onboarding Stripe Connect |
| POST | `/public/psy/:slug/book` | Modifié : accepte `payOnline: boolean`, `consultationTypeId` |
| POST | `/public/psy/:slug/book/checkout` | Nouveau : crée Stripe Checkout + booking |
| POST | `/billing/webhooks/stripe` | Modifié : gère `checkout.session.completed` pour bookings |

**Flow Stripe Connect onboarding :**
1. `POST /billing/connect/onboard` :
   - Crée un `stripe.accounts.create({ type: 'express', country: 'FR', email: psy.email })`
   - Sauvegarde `stripeAccountId` sur le profil
   - Crée un Account Link : `stripe.accountLinks.create({ account: stripeAccountId, type: 'account_onboarding', return_url, refresh_url })`
   - Retourne `{ onboardingUrl: accountLink.url }`
2. Le psy complète le KYC sur Stripe
3. Webhook `account.updated` → vérifie `charges_enabled` + `payouts_enabled` → `stripeOnboardingComplete: true`

**Flow détaillé `POST /public/psy/:slug/book/checkout` :**
1. Valider les données de booking (patient, créneau, motif)
2. Vérifier que le créneau est libre (conflit check avec la durée du motif choisi)
3. Vérifier `psy.stripeOnboardingComplete === true`
4. Créer l'appointment avec `status: 'scheduled'`, `paymentStatus: 'pending_payment'`
5. Créer Stripe Checkout Session :
   - `mode: 'payment'`
   - `line_items: [{ price_data: { unit_amount: motif.rate * 100, currency: 'eur', product_data: { name: motif.name } }, quantity: 1 }]`
   - `payment_intent_data: { application_fee_amount: 0, transfer_data: { destination: psy.stripeAccountId } }`
   - `metadata: { appointmentId, psychologistId }`
   - `success_url: /psy/{slug}/booking-confirmed?paid=true`
   - `cancel_url: /psy/{slug}?canceled=true`
   - `expires_at: Math.floor(Date.now()/1000) + 1800` (30 minutes)
6. Retourner `{ checkoutUrl: session.url }`

> Note : `application_fee_amount: 0` pour le lancement. PsyLib pourra ajouter une commission plus tard (ex: 2% par transaction).

**Webhook `checkout.session.completed` :**
1. Extraire `appointmentId` des metadata
2. Mettre à jour l'appointment : `paymentStatus: 'paid'`, `paidOnline: true`, `paymentIntentId: session.payment_intent`
3. Envoyer email de confirmation avec reçu au patient

**Cron nettoyage créneaux fantômes** (toutes les 5 minutes) :
1. Trouver les appointments où `paymentStatus = 'pending_payment'` ET `createdAt < now() - 35min`
2. Les passer en `paymentStatus: 'payment_failed'`, `status: 'cancelled'`
3. Le créneau redevient disponible

**StripeService — nouvelle méthode :**
Ajouter `createBookingCheckoutSession()` avec `mode: 'payment'` et `price_data` (distinct de `createCheckoutSession()` qui gère les subscriptions en `mode: 'subscription'`).

### Frontend

**Page booking `/psy/[slug]`** — étape 3 (après motif + créneau) :
- Si `psy.allowOnlinePayment` :
  - Radio button : "Payer en ligne maintenant (CB)" / "Payer au cabinet le jour du RDV"
  - Si "Payer en ligne" → redirect vers Stripe Checkout
  - Si "Payer au cabinet" → booking classique
- Si `!psy.allowOnlinePayment` :
  - Pas de choix affiché, booking direct

**Calendrier psy** — indicateur visuel :
- Badge "Payé en ligne" (vert) sur les appointments payés
- Badge "Paiement au cabinet" (gris) sur les autres

**Settings `/dashboard/settings/practice`** :
- Toggle "Autoriser le paiement en ligne lors de la prise de RDV"
- Info : "Les patients pourront choisir de payer par carte bancaire au moment de la réservation"

---

## 4. Liste d'attente

### Objectif
Quand le psy n'a plus de créneaux disponibles, les patients peuvent s'inscrire sur une liste d'attente. Le psy est notifié quand un créneau se libère pour proposer à un patient en attente.

### Modèle de données

```prisma
model WaitlistEntry {
  id              String   @id @default(uuid())
  psychologistId  String   @map("psychologist_id")
  patientName     String   @map("patient_name")
  patientEmail    String   @map("patient_email")
  patientPhone    String?  @map("patient_phone")
  consultationTypeId String? @map("consultation_type_id") // Motif souhaité
  urgency         WaitlistUrgency @default(low)
  preferredSlots  Json?    @map("preferred_slots") // { mornings: bool, afternoons: bool, preferredDays: number[] }
  note            String?  // Motif / contexte — CHIFFRÉ AES-256-GCM (peut contenir données de santé)
  status          WaitlistStatus @default(waiting)
  contactedAt     DateTime? @map("contacted_at")
  createdAt       DateTime @default(now()) @map("created_at")

  psychologist    Psychologist @relation(fields: [psychologistId], references: [id], onDelete: Cascade)
  consultationType ConsultationType? @relation(fields: [consultationTypeId], references: [id])

  @@index([psychologistId, status], name: "idx_waitlist_psy_status")
  @@map("waitlist_entries")
}

enum WaitlistUrgency {
  low
  medium
  high
}

enum WaitlistStatus {
  waiting     // En attente
  contacted   // Contacté par le psy
  scheduled   // RDV pris
  removed     // Retiré de la liste
}
```

### API

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/waitlist` | Liste d'attente du psy (auth) |
| POST | `/waitlist` | Ajouter manuellement (psy, auth) |
| PUT | `/waitlist/:id` | Modifier statut/urgence |
| DELETE | `/waitlist/:id` | Retirer de la liste |
| POST | `/waitlist/:id/propose-slot` | Envoyer un email avec créneau proposé |
| POST | `/public/psy/:slug/waitlist` | Patient s'inscrit (no auth, rate limited) |

**Notification d'annulation :**
Quand un appointment passe en `status: cancelled` :
1. Vérifier s'il y a des entrées `waitlist` avec `status: waiting`
2. Si oui → notification in-app au psy : "Un créneau s'est libéré le [date]. Proposer à [patient] de la liste d'attente ?"
3. Le psy clique "Proposer" → email envoyé au patient avec lien de booking pré-rempli

**Rate limiting public :** 3 req/min, 10 req/hour par IP (aligné avec le booking public).

### Frontend

**Page `/dashboard/waitlist`** (nouvelle) :
- Tableau triable : nom, email, motif souhaité, urgence (badge couleur), préférences horaires, date inscription, statut
- Filtres : urgence, motif, statut
- Actions par ligne : "Proposer un créneau", "Marquer contacté", "Retirer"
- Compteur en sidebar : "Liste d'attente (X)"

**Page booking publique** :
- Si aucun créneau disponible dans les 30 prochains jours → afficher :
  "Aucun créneau disponible. Inscrivez-vous sur la liste d'attente pour être prévenu dès qu'une place se libère."
- Formulaire : nom, email, téléphone, motif souhaité (dropdown), préférence horaire, message

**Sidebar dashboard** — badge sur "Liste d'attente" avec le nombre d'entrées actives.

---

## 5. Rappels SMS (architecture prête)

### Objectif
Préparer l'architecture pour envoyer des rappels par SMS en plus des emails. Provider SMS branché plus tard (Twilio ou OVH).

### Architecture

```
ReminderService
  ├── EmailReminderProvider (Resend — déjà actif)
  └── SmsReminderProvider (interface — stub pour l'instant)
        ├── TwilioSmsProvider (futur)
        └── OvhSmsProvider (futur)
```

### Modèle de données

```prisma
model Psychologist {
  // ... champs existants
  reminderDelay       Int      @default(24) @map("reminder_delay") // heures avant RDV
  reminderSmsEnabled  Boolean  @default(false) @map("reminder_sms_enabled")
  reminderEmailEnabled Boolean @default(true) @map("reminder_email_enabled")
  reminderTemplate    String?  @map("reminder_template") // Template personnalisé
}
```

Modification de `Appointment` :
```prisma
model Appointment {
  // ... champs existants
  reminderSentAt      DateTime? @map("reminder_sent_at")    // déjà existant
  smsReminderSentAt   DateTime? @map("sms_reminder_sent_at") // déjà existant
}
```

### Service

```typescript
// reminder.service.ts
@Injectable()
export class ReminderService {
  // Cron : toutes les 15 minutes, vérifie les appointments à rappeler
  @Cron('0 */15 * * * *')
  async processReminders() {
    // 1. Trouver les appointments où :
    //    - status IN ('scheduled', 'confirmed')
    //    - scheduledAt BETWEEN now+reminderDelay-15min AND now+reminderDelay
    //    - reminderSentAt IS NULL (email) ou smsReminderSentAt IS NULL (sms)
    // 2. Pour chaque appointment :
    //    - Si psy.reminderEmailEnabled → envoyer email
    //    - Si psy.reminderSmsEnabled && patient.phone → envoyer SMS (via provider)
    // 3. Marquer reminderSentAt / smsReminderSentAt
  }
}

// sms-provider.interface.ts
export interface SmsProvider {
  sendSms(to: string, message: string): Promise<{ success: boolean; messageId?: string }>;
}

// stub-sms.provider.ts (pour l'instant)
@Injectable()
export class StubSmsProvider implements SmsProvider {
  async sendSms(to: string, message: string) {
    console.log(`[SMS STUB] To: ${to}, Message: ${message}`);
    return { success: true, messageId: 'stub-' + Date.now() };
  }
}
```

### Variables de template

Le message de rappel supporte ces variables :
- `{patient_name}` — Nom du patient
- `{psy_name}` — Nom du psychologue
- `{date}` — Date du RDV (ex: "lundi 7 avril")
- `{heure}` — Heure (ex: "14h30")
- `{duree}` — Durée (ex: "45 min")
- `{motif}` — Nom du motif de consultation
- `{adresse}` — Adresse du cabinet

**Template par défaut :**
> Rappel : Vous avez RDV avec {psy_name} le {date} à {heure} ({motif}, {duree}). Adresse : {adresse}. Pour annuler, contactez le cabinet.

### Frontend

**Page `/dashboard/settings/practice`** — section "Rappels" :
- Toggle "Rappel par email" (actif par défaut)
- Toggle "Rappel par SMS" (désactivé, grisé avec mention "Bientôt disponible")
- Select : délai de rappel (24h, 48h, 72h)
- Textarea : template personnalisé avec variables disponibles

---

## 6. Migrations Prisma

Une seule migration pour tout le lot :

```
prisma migrate dev --name lot1_consultation_types_msp_waitlist_payments
```

### Nouvelles tables
- `consultation_types`
- `mon_soutien_psy_tracking`
- `waitlist_entries`

### Nouveaux enums
- `ConsultationCategory` (standard, mon_soutien_psy)
- `BookingPaymentStatus` (none, pending_payment, paid, payment_failed)
- `WaitlistUrgency` (low, medium, high)
- `WaitlistStatus` (waiting, contacted, scheduled, removed)

### Colonnes ajoutées
- `appointments.consultation_type_id` (FK nullable)
- `appointments.payment_intent_id` (nullable)
- `appointments.paid_online` (boolean default false)
- `appointments.booking_payment_status` (enum default 'none')
- `appointments.created_at` (timestamp default now())
- `psychologists.allow_online_payment` (boolean default false)
- `psychologists.stripe_account_id` (text unique nullable)
- `psychologists.stripe_onboarding_complete` (boolean default false)
- `psychologists.reminder_delay` (int default 24)
- `psychologists.reminder_sms_enabled` (boolean default false)
- `psychologists.reminder_email_enabled` (boolean default true)
- `psychologists.reminder_template` (text nullable)

### Colonnes renommées
- `psy_network_profiles.accepts_mon_psy` → `accepts_mon_soutien_psy` (rename via migration)

---

## 7. Modules NestJS

### Nouveaux modules
- `ConsultationTypesModule` — CRUD motifs + validation MSP
- `MonSoutienPsyModule` — tracking + compteur + alertes
- `WaitlistModule` — CRUD + notification sur annulation
- `ReminderModule` — cron rappels + providers SMS

### Modules modifiés
- `AppointmentsModule` — intégration consultationType + paiement en ligne
- `BillingModule` — Stripe Connect onboarding + webhook checkout.session.completed + `createBookingCheckoutSession()` méthode (mode: 'payment')
- `PublicBookingModule` — choix motif + paiement + liste d'attente
- `NotificationsModule` — nouvelles notifications MSP + waitlist

---

## 8. Routes frontend nouvelles/modifiées

| Route | Action |
|-------|--------|
| `/dashboard/settings/practice` | Ajouter sections : motifs, rappels, paiement en ligne, MSP |
| `/dashboard/waitlist` | **Nouvelle** — liste d'attente |
| `/dashboard/patients/[id]` | Ajouter section Mon Soutien Psy (compteur) |
| `/psy/[slug]` | Adapter booking : choix motif → créneaux → paiement |
| `/psy/[slug]/booking-confirmed` | **Nouvelle** — confirmation après paiement |
| `/psy/[slug]/waitlist` | Formulaire inscription liste d'attente (intégré à la page booking) |

---

## 9. Shared types à ajouter

```typescript
// packages/shared-types/src/index.ts

export enum ConsultationCategory {
  STANDARD = 'standard',
  MON_SOUTIEN_PSY = 'mon_soutien_psy',
}

export enum WaitlistUrgency {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum WaitlistStatus {
  WAITING = 'waiting',
  CONTACTED = 'contacted',
  SCHEDULED = 'scheduled',
  REMOVED = 'removed',
}

export interface ConsultationType {
  id: string;
  psychologistId: string;
  name: string;
  duration: number;
  rate: number; // Serialized from Prisma Decimal via Number() in service layer
  color: string;
  category: ConsultationCategory;
  isPublic: boolean;
  isActive: boolean;
  sortOrder: number;
}

export enum BookingPaymentStatus {
  NONE = 'none',
  PENDING_PAYMENT = 'pending_payment',
  PAID = 'paid',
  PAYMENT_FAILED = 'payment_failed',
}

export interface PreferredSlots {
  mornings: boolean;
  afternoons: boolean;
  preferredDays: number[]; // 0=Mon ... 6=Sun
}

export interface MonSoutienPsyTracking {
  id: string;
  patientId: string;
  year: number;
  sessionsUsed: number;
  maxSessions: number;
  firstSessionAt: string | null;
  lastSessionAt: string | null;
}

export interface WaitlistEntry {
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string | null;
  consultationTypeId: string | null;
  consultationType?: ConsultationType;
  urgency: WaitlistUrgency;
  preferredSlots: string | null;
  note: string | null;
  status: WaitlistStatus;
  contactedAt: string | null;
  createdAt: string;
}

export const MON_SOUTIEN_PSY_RATE = 50.00;
export const MON_SOUTIEN_PSY_MAX_SESSIONS = 12;
```

---

## 10. Sécurité & conformité

- **Tenant isolation** : toutes les queries consultation_types, waitlist, MSP tracking filtrées par `psychologistId`
- **Rate limiting** : endpoints publics (booking, waitlist inscription) rate-limités
- **Audit logs** : création/modification de séances MSP loguée dans `audit_logs`
- **Données waitlist** : le champ `note` est chiffré AES-256-GCM car le patient peut y décrire son motif (donnée de santé potentielle). `name`, `email`, `phone` ne sont pas chiffrés (données de contact, pas de santé).
- **Stripe** : webhooks vérifiés par signature, idempotency via `stripe_events`
- **Paiement** : aucune donnée CB ne transite par PsyLib (Stripe Checkout hébergé)

---

## 11. Tests

### Backend (Vitest + Supertest)

- `consultation-types.service.spec.ts` — CRUD + validation tarif MSP bloqué
- `mon-soutien-psy.service.spec.ts` — compteur, alertes quota, reset annuel
- `waitlist.service.spec.ts` — CRUD + notification sur annulation
- `reminder.service.spec.ts` — cron logic + template variables
- `public-booking.controller.spec.ts` — flow complet avec motif + paiement
- `appointments.service.spec.ts` — mise à jour pour nouveau flow

### Frontend (Playwright)

- Booking flow complet : choix motif → créneau → paiement → confirmation
- Settings : configuration motifs, rappels, paiement en ligne
- Waitlist : inscription patient + gestion psy
- Fiche patient : compteur MSP affiché correctement
