# Empreinte bancaire (carte enregistrée) — Design

**Date :** 2026-06-04
**Statut :** Validé, prêt pour plan d'implémentation
**Auteur :** Tony Ruppel (via Claude)

---

## 1. Objectif

Permettre à un psychologue de demander l'**enregistrement de la carte bancaire** d'un patient au moment de la réservation d'un rendez-vous, afin de pouvoir, à la fin de la séance ou en cas d'absence (« lapin »), **encaisser librement** un montant (0€, tarif plein ou montant custom) ou **libérer l'empreinte** sans rien débiter.

Fonctionne de façon identique en **visio** et **au cabinet** — la garantie est attachée au rendez-vous, pas à la modalité.

## 2. Décisions de conception (validées)

| Décision | Choix retenu | Raison |
|---|---|---|
| Mécanique | **Carte enregistrée (SetupIntent)**, pas de pré-autorisation | Une vraie pré-autorisation Stripe expire en 7 jours ; inadapté aux RDV réservés plusieurs semaines à l'avance. La carte enregistrée n'a pas de limite de durée. |
| Déclenchement | **Réglage par type de consultation** (`ConsultationType.requireImprint`) | Granularité fine (ex : empreinte sur première séance uniquement), s'intègre au modèle existant. |
| Montant encaissé | **Montant libre** au moment d'encaisser | Flexibilité maximale (rien / tarif plein / frais de lapin partiel). |

## 3. Contexte technique existant

- Les paiements patients utilisent des **destination charges** Stripe Connect (`transfer_data.destination`) : la charge a lieu sur le compte **plateforme**, les fonds sont transférés au compte connecté du psy.
- Le `Customer` Stripe est créé sur le compte **plateforme** (`createOrRetrieveCustomer`, clé `metadata.psychologist_id`).
- **Conséquence clé :** une carte enregistrée sur le Customer plateforme peut être débitée plus tard vers n'importe quel compte connecté via destination charge — sans la limite des 7 jours d'une pré-autorisation.
- Feature paiements gatée **Pro/Clinic**, nécessite Connect onboardé (`stripeAccountId` + `stripeOnboardingComplete` sur `Subscription`).
- ⚠️ **Blocage actif (2026-06-02)** : Stripe Connect n'est pas encore activé sur le compte plateforme live. La feature pourra être codée/testée mais nécessitera l'activation Connect côté Stripe pour tourner en prod. Pas un bloquant pour le développement.

## 4. Modèle de données (Prisma)

### Nouvel enum
```prisma
enum CardHoldStatus {
  none      // pas d'empreinte demandée
  pending   // empreinte demandée, carte pas encore enregistrée
  secured   // carte enregistrée, prête à être débitée
  captured  // un montant a été encaissé
  released  // empreinte libérée sans débit
  failed    // échec d'enregistrement ou de capture
}
```

### Modifications de modèles
- **`ConsultationType`** : `requireImprint Boolean @default(false) @map("require_imprint")`
- **`Appointment`** :
  - `stripeCustomerId String? @map("stripe_customer_id")`
  - `stripePaymentMethodId String? @map("stripe_payment_method_id")`
  - `cardHoldStatus CardHoldStatus @default(none) @map("card_hold_status")`
  - réutilise `paymentIntentId`, `paymentAmount` (déjà présents) pour la capture finale.
- **`AppointmentPaymentMode`** : ajout de la valeur `imprint`.

### Migration
Idempotente (`IF NOT EXISTS` / `ADD VALUE IF NOT EXISTS`), nommée `20260604_card_imprint`.

## 5. Flux fonctionnels

### Flux A — réservation publique par le patient (cas principal)
1. Le patient choisit un `ConsultationType` marqué `requireImprint=true`.
2. La `BookingModal` affiche un **encart de consentement** : politique d'annulation du psy + texte « Pour garantir ce rendez-vous, le praticien demande l'enregistrement de votre carte. Vous ne serez débité que selon sa politique d'annulation ou en cas d'absence. » + **case à cocher obligatoire**.
3. À la soumission : création de l'`Appointment` en `status=confirmed`, `cardHoldStatus=pending`, `paymentMode=imprint`.
4. Création d'une session **Stripe Checkout `mode:'setup'`** (Customer plateforme du patient, `usage: off_session`, `metadata.appointmentId`).
5. Redirection du patient vers Checkout → saisie carte + SCA.
6. Webhook `checkout.session.completed` (mode setup) : récupère le `setup_intent` → `payment_method`, enregistre `stripeCustomerId` + `stripePaymentMethodId` sur l'Appointment, passe à `cardHoldStatus=secured`, envoie les emails de confirmation (patient + psy).

### Flux B — RDV créé par le psy (SmartSlotPicker)
1. Le psy coche « Demander une empreinte » dans le dialog de création.
2. RDV créé en `cardHoldStatus=pending`.
3. Email au patient avec un **lien sécurisé** (`POST /billing/imprint/setup/:appointmentId` génère le même Checkout setup, expiration 24h) : « Sécurisez votre rendez-vous ».
4. Même webhook que le flux A → `secured`.

### Flux C — encaissement / libération (fin de séance ou lapin)
Dans les actions du RDV (agenda / `PaymentActions`), quand `cardHoldStatus=secured` :

- **« Encaisser »** → dialog **montant libre** (présélection = tarif plein du type ; champ libre éditable) → `POST /billing/imprint/capture/:appointmentId { amount }` :
  - Crée un PaymentIntent `off_session: true, confirm: true`, `customer`, `payment_method`, `transfer_data.destination` = compte connecté du psy, montant en centimes.
  - En cas de succès : crée un `Payment` (type `session`, status `paid`), passe l'Appointment à `cardHoldStatus=captured`, `paymentAmount` renseigné, déclenche la **facture auto** (système BullMQ existant), envoie un reçu au patient.
- **« Libérer l'empreinte »** → `POST /billing/imprint/release/:appointmentId` → `cardHoldStatus=released`, aucun débit.

### Gestion de l'échec SCA off-session
Si le PaymentIntent renvoie `requires_action` / `authentication_required` (la carte exige une ré-authentification) :
- On n'échoue pas silencieusement : on bascule automatiquement sur l'envoi d'un **lien de paiement** au patient (flux `createPaymentLink` existant, montant = celui demandé).
- Notification au psy : « La carte du patient nécessite une validation. Un lien de paiement lui a été envoyé. »
- `cardHoldStatus` reste `secured` (l'empreinte n'est pas consommée) ; le paiement suivra le cycle de vie du lien.

## 6. Endpoints (NestJS)

| Method | Route | Accès | Description |
|---|---|---|---|
| POST | `/billing/imprint/setup/:appointmentId` | Psy (Pro/Clinic) | Génère le lien Checkout setup (flux B) |
| — | Checkout setup créé inline dans le controller booking public | Public | Flux A, à la réservation |
| POST | `/billing/imprint/capture/:appointmentId` | Psy (Pro/Clinic) | Encaisse un montant libre |
| POST | `/billing/imprint/release/:appointmentId` | Psy (Pro/Clinic) | Libère l'empreinte sans débit |
| — | `checkout.session.completed` étendu au `mode:setup` | Stripe (webhook) | Finalise l'enregistrement de la carte |

**Patterns à respecter** (cf. mémoire projet) :
- Controller authentifié : `@CurrentUser() user: KeycloakUser`, jamais `@Req()`.
- Feature gate : `@UseGuards(SubscriptionGuard)` + `@RequirePlan(PRO, CLINIC)`.
- Endpoints publics : controller séparé sans `@UseGuards`.
- Montants : services reçoivent des euros, conversion en centimes dans `StripeService`.
- `forwardRef()` entre AppointmentsModule ↔ BillingModule (déjà en place).
- Validation Zod / DTO `class-validator` sur tous les inputs (montant > 0, ≤ plafond raisonnable).

## 7. Services Stripe (nouvelles méthodes)

- `StripeService.createSetupCheckoutSession({ customerId, appointmentId, successUrl, cancelUrl, expiresInSeconds })` — Checkout `mode:'setup'`.
- `StripeService.captureImprint({ customerId, paymentMethodId, connectedAccountId, amount, appointmentId })` — PaymentIntent off-session ; renvoie le statut (succès / requires_action) pour permettre le fallback lien.

## 8. Sécurité & conformité HDS/RGPD

- **Aucune donnée de carte stockée** côté PsyLib : uniquement des identifiants Stripe (`customer`, `payment_method`). PCI délégué à Stripe.
- **Consentement explicite** affiché et horodaté à la réservation (case à cocher) ; politique d'annulation visible.
- **`audit_logs`** sur `capture` (CREATE payment) et `release`.
- Note à ajouter au **modèle de consentement patient** et/ou **CGU** : possibilité de frais d'annulation / d'empreinte.
- Filtrage `psychologist_id` systématique sur les routes psy.

## 9. Frontend

- **Settings type de consultation** : toggle « Demander une empreinte bancaire » (gated Pro/Clinic, upsell sinon).
- **BookingModal (public)** : encart consentement + case à cocher quand le type sélectionné a `requireImprint`.
- **SmartSlotPickerDialog (psy)** : case « Demander une empreinte ».
- **PaymentActions / agenda** : boutons « Encaisser » (dialog montant libre) + « Libérer l'empreinte » quand `secured` ; badge d'état d'empreinte.
- **billingApi** : nouvelles méthodes `setupImprint`, `captureImprint`, `releaseImprint`.

## 10. Tests

- `StripeService` : `createSetupCheckoutSession`, `captureImprint` (succès + `requires_action`).
- `SubscriptionService` / billing : capture, release, fallback lien, création Payment + facture.
- Webhook : traitement `checkout.session.completed` en `mode:setup`.
- 1 spec E2E : parcours réservation publique avec empreinte → secured → capture.

## 11. Hors périmètre (YAGNI)

- Vraie pré-autorisation 7 jours.
- Empreinte sur les abonnements PsyLib.
- Multi-cartes par patient (on conserve la dernière carte enregistrée).
- Capture partielle multiple (une seule capture par empreinte).
