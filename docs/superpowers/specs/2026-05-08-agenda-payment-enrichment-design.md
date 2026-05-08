# Enrichissement Agenda, Types de Consultation & Paiements

**Date:** 2026-05-08
**Scope:** 5 features code + 1 document DPA
**Context:** Demande d'une psychologue fondatrice — gaps identifiés dans l'agenda, la gestion des types de consultation, les paiements offline, et la conformite.

---

## 1. Pause entre rendez-vous

**Probleme:** Les RDV peuvent etre planifies dos-a-dos sans temps de pause.

**Solution:**
- Champ `Psychologist.minBreakMinutes` (Int, default 0)
- `AvailabilityService.getAvailableTimeslots()` ajoute un buffer apres chaque RDV existant
- Settings > Cabinet : select (0/5/10/15/20/30 min)

**Logique:** Un RDV de 50min avec 10min de pause = le prochain creneau dispo commence a +60min.

---

## 2. Methode de paiement offline

**Probleme:** Quand le psy marque "paye sur place", on ne sait pas si c'est especes, cheque, CB ou virement.

**Solution:**
- Enum `OfflinePaymentMethod`: `cash | check | card | transfer | other`
- Champ `Appointment.offlinePaymentMethod` (nullable)
- UI "Marquer paye" affiche un selecteur de methode
- Affichage de la methode dans le detail du RDV et l'historique

---

## 3. Parametres par type de consultation

**Probleme:** Les types de consultation n'ont que nom/duree/tarif. Manque modalite, lieu, consignes, regles de paiement et d'annulation.

**Solution — 5 nouveaux champs sur `ConsultationType`:**

| Champ | Type | Default | Description |
|-------|------|---------|-------------|
| `modality` | Enum `in_person/online/home_visit/any` | `any` | Modalite de la seance |
| `location` | String? | null | Lieu personnalise |
| `instructions` | String? | null | Consignes transmises au patient |
| `allowedPaymentModes` | String? | null | Modes de paiement acceptes (null = herite global psy) |
| `cancellationDelay` | Int? | null | Delai d'annulation en heures (null = herite global psy) |

**Frontend:**
- Formulaire ConsultationTypesSettings enrichi avec les 5 champs
- Public booking : affiche consignes, filtre par modalite, applique regles per-type

**Logique cascade:** Si un champ per-type est null, on utilise la valeur globale du psychologue.

---

## 4. Facturation absence / no-show

**Probleme:** Le psy peut marquer "absent" mais ne peut pas facturer automatiquement.

**Solution:**
- `Psychologist.noShowBillingEnabled` (Boolean, default false)
- `Psychologist.noShowFee` (Decimal?, default null) — montant de facturation. Si null, utilise le tarif de la seance.
- Quand statut passe a `no_show` ET billing enabled : creation automatique d'une facture via InvoiceService
- Settings > Paiements : toggle + champ montant
- UI calendrier : dialog de confirmation "Marquer absent" avec apercu facturation

---

## 5. Raison d'annulation

**Probleme:** Pas de tracabilite sur qui a annule ni pourquoi.

**Solution:**
- `Appointment.cancellationReason` (String?, nullable)
- `Appointment.cancelledBy` (Enum `patient | psychologist | system`, nullable)
- Dialog d'annulation (psy) : champ texte optionnel
- Page annulation patient : champ texte optionnel
- Historique : affichage raison + par qui

---

## 6. Document DPA sous-traitants

**Document `docs/DPA-sous-traitants.md`** listant :

| Sous-traitant | Donnees | Localisation | Finalite | DPA |
|---------------|---------|-------------|----------|-----|
| OVH | Toutes donnees | France | Hebergement HDS | Contrat OVH HDS |
| Stripe | Facturation psy | UE (Ireland) | Paiements | stripe.com/fr/legal/dpa |
| Resend | Email destinataire | US (SES) | Emails transactionnels | resend.com/legal/dpa |
| OpenRouter/Anthropic | Notes (avec consentement) | US | IA | openrouter.ai/terms |
| LiveKit | Metadonnees video | France (self-hosted) | Visio | N/A (self-hosted) |

---

## Migration DB

Migration unique `20260508_agenda_payment_enrichment` :

```sql
-- 1. Pause entre RDV
ALTER TABLE psychologists ADD COLUMN "minBreakMinutes" INTEGER NOT NULL DEFAULT 0;

-- 2. Methode paiement offline
CREATE TYPE "OfflinePaymentMethod" AS ENUM ('cash', 'check', 'card', 'transfer', 'other');
ALTER TABLE appointments ADD COLUMN "offlinePaymentMethod" "OfflinePaymentMethod";

-- 3. Types de consultation enrichis
CREATE TYPE "ConsultationModality" AS ENUM ('in_person', 'online', 'home_visit', 'any');
ALTER TABLE consultation_types ADD COLUMN "modality" "ConsultationModality" NOT NULL DEFAULT 'any';
ALTER TABLE consultation_types ADD COLUMN "location" TEXT;
ALTER TABLE consultation_types ADD COLUMN "instructions" TEXT;
ALTER TABLE consultation_types ADD COLUMN "allowedPaymentModes" TEXT;
ALTER TABLE consultation_types ADD COLUMN "cancellationDelay" INTEGER;

-- 4. No-show billing
ALTER TABLE psychologists ADD COLUMN "noShowBillingEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE psychologists ADD COLUMN "noShowFee" DECIMAL(10,2);

-- 5. Raison d'annulation
CREATE TYPE "CancelledBy" AS ENUM ('patient', 'psychologist', 'system');
ALTER TABLE appointments ADD COLUMN "cancellationReason" TEXT;
ALTER TABLE appointments ADD COLUMN "cancelledBy" "CancelledBy";
```

---

## Fichiers impactes

### Backend (apps/api/)
- `prisma/schema.prisma` — nouveaux champs + enums
- `src/availability/availability.service.ts` — logique buffer
- `src/appointments/appointments.service.ts` — offlinePaymentMethod, cancellationReason, cancelledBy
- `src/appointments/appointments.controller.ts` — DTOs enrichis
- `src/appointments/dto/` — update DTOs
- `src/consultation-types/consultation-types.service.ts` — nouveaux champs
- `src/consultation-types/dto/` — update DTOs
- `src/psychologists/psychologists.service.ts` — nouveaux settings
- `src/invoices/invoices.service.ts` — no-show invoice creation
- `src/public-booking/public-booking.controller.ts` — afficher consignes, appliquer regles per-type

### Frontend (apps/web/)
- `src/components/settings/consultation-types-settings.tsx` — 5 nouveaux champs
- `src/components/settings/payment-settings.tsx` — no-show billing toggle
- `src/components/settings/practice-info-settings.tsx` — pause entre RDV
- `src/components/calendar/` — dialog "Marquer paye" enrichi, dialog "Absent" avec facturation
- `src/app/(auth)/psy/[slug]/` — afficher consignes, modalite dans public booking

### Shared Types
- `packages/shared-types/src/index.ts` — nouveaux enums + types
