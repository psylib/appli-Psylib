# Spec — "Prévenez-moi si une place se libère plus tôt" (Earlier-Slot Waitlist)

**Date :** 2026-06-07
**Statut :** Validé (brainstorming) — prêt pour plan d'implémentation
**Auteur :** Tony Ruppel + Claude

---

## 1. Objectif

Reproduire la fonction Doctolib « être prévenu si une place se libère plus tôt ».
Quand un patient réserve un RDV (le 1er créneau dispo est parfois loin), il peut cocher
une option pour être **prévenu par email** dès qu'une place **antérieure à son RDV**
se libère chez le même psychologue, avec un lien pour basculer son RDV sur ce créneau
(1er arrivé, 1er servi).

La fonctionnalité est **rattachée au RDV existant du patient**. Elle est distincte de la
`WaitlistEntry` manuelle gérée par le psy (qui reste inchangée).

### Décisions produit validées
- **Point d'entrée :** page de réservation publique (`psylib.eu/psy/:slug/book`).
- **Matching :** uniquement les créneaux **plus tôt que le RDV actuel** du patient (évite le spam).
- **Récupération :** lien email, **1er arrivé / 1er servi** (pas de réservation temporisée).
- **Toggle psy :** `earlierSlotEnabled` **activé par défaut** (le psy peut désactiver dans les réglages).

---

## 2. Données (Prisma)

### Sur `Appointment`
| Champ | Type | Notes |
|---|---|---|
| `notifyEarlierSlot` | `Boolean @default(false)` | Le patient a opté pour l'alerte |
| `earlierSlotToken` | `String? @unique` | Jeton du lien de rebascule (généré à l'opt-in, pattern `cancelToken`) |
| `earlierSlotNotifiedAt` | `DateTime?` | Anti-spam : 1 email / 6 h max par RDV |

### Sur `Psychologist`
| Champ | Type | Notes |
|---|---|---|
| `earlierSlotEnabled` | `Boolean @default(true)` | Toggle réglages cabinet (activé par défaut) |

**Migration** idempotente (`ADD COLUMN IF NOT EXISTS`), appliquée VPS manuellement.
Index : aucun nouvel index requis a priori — le matching s'appuie sur l'index existant
`idx_appointments_psy_status_date (psychologistId, status, scheduledAt)`. À confirmer
lors du plan selon la requête réelle.

---

## 3. Déclenchement (backend, event-driven)

### Nouvel événement domaine
`slot.freed { psychologistId: string, freedAt: Date }`

Émis dans deux cas :
1. **Annulation** d'un RDV → `appointments.service.cancel()` (en plus du hook existant
   `waitlistService.onAppointmentCancelled` qui notifie le psy — conservé tel quel).
2. **Rebascule** d'un patient sur un créneau plus tôt → son ancienne heure se libère
   (effet cascade : un patient encore plus tard peut récupérer cette place).

### `EarlierSlotListener` (`@OnEvent('slot.freed')`)
1. Sélectionne les RDV éligibles :
   - même `psychologistId`
   - `status ∈ { scheduled, confirmed }`
   - `notifyEarlierSlot = true`
   - `scheduledAt > freedAt` (le RDV du patient est postérieur au créneau libéré)
   - `freedAt > now` (le créneau libéré est dans le futur)
   - psy avec `earlierSlotEnabled = true`
   - `earlierSlotNotifiedAt` null OU plus ancien que 6 h (anti-spam)
2. Vérifie via `availabilityService.getAvailableTimeslots(psyId, freedAt, freedAt + durée, patientDuration)`
   que `freedAt` accueille réellement la durée du RDV du patient (gère buffers, conflits,
   Google Calendar — logique déjà testée).
3. Envoie l'email à **tous** les RDV éligibles (FCFS), met `earlierSlotNotifiedAt = now`.
   Pas de cap (Doctolib notifie tout le monde) ; le volume reste faible par psy.

---

## 4. Récupération — page publique token

Le lien email pointe vers `psylib.eu/rebook/:token`.

**Principe anti-course :** la page ne réserve pas un créneau figé. Elle (re)calcule au clic
**tous les créneaux disponibles plus tôt** que le RDV actuel et les affiche. Le patient en
choisit un. Si le créneau initial a déjà été pris par un autre, d'autres restent proposés.

### Endpoints publics (auth par token, rate-limited)
| Method | Route | Description |
|---|---|---|
| GET | `/public/rebook/:token` | RDV actuel (date, psy, durée) + créneaux dispo plus tôt |
| POST | `/public/rebook/:token` | `{ newSlot: ISO }` → déplace le RDV |
| GET | `/public/rebook/:token/unsubscribe` | Coupe `notifyEarlierSlot` (lien "ne plus me prévenir", RGPD) |

### Déplacement du RDV (`POST`)
Transaction **`Serializable`** (même pattern que la résa publique anti-double-booking) :
1. Re-vérifie que `newSlot` est libre et bien antérieur à `scheduledAt` actuel.
2. Met à jour `appointment.scheduledAt = newSlot`, reset `earlierSlotNotifiedAt`.
3. Émet `slot.freed { psychologistId, freedAt: ancienneHeure }` (cascade).
4. Invalide le cache des slots (`slots:{slug}:*`).
5. Email de confirmation au patient + notification in-app/email au psy (réutilise le flux
   `appointment.updated` existant).
6. Audit log (déjà couvert par le chemin `update`).

---

## 5. Frontend

- **Page de réservation publique** (`create-appointment-dialog` / flow public booking) :
  checkbox à l'étape de confirmation → `notifyEarlierSlot: true` dans `PublicBookingDto`.
  Le backend génère `earlierSlotToken` si coché.
- **Nouvelle page `/rebook/[token]`** (`apps/web/src/app/rebook/[token]/page.tsx`) :
  récap du RDV actuel + liste des créneaux plus tôt (réutilise le composant de sélection
  de slots de la résa publique) + confirmation de bascule.
- **Réglages cabinet** : toggle « Proposer aux patients d'être prévenus si une place se
  libère plus tôt » lié à `psychologist.earlierSlotEnabled` (activé par défaut).

---

## 6. Email

`EmailService.sendEarlierSlotAvailable(to, { psyName, currentDate, claimUrl, unsubscribeUrl })`
- Réutilise le style des templates existants (`sendWaitlistProposal` comme base).
- **Aucune donnée de santé** : uniquement nom du psy + dates + liens.
- `claimUrl = https://psylib.eu/rebook/:token`
- `unsubscribeUrl = https://psylib.eu/rebook/:token/unsubscribe`

---

## 7. Sécurité / Conformité

- Token aléatoire `crypto.randomBytes` (pattern `cancelToken` existant), unique, non devinable.
- Aucune donnée patient sensible dans l'email.
- Rate-limiting sur les routes publiques `/public/rebook/*`.
- Lien de désinscription (RGPD / contrôle du spam).
- Le déplacement de RDV passe par le chemin d'audit existant (`appointment.updated`).

---

## 8. Hors scope (YAGNI)

- Pas de réservation temporisée / timers (option « place réservée X minutes » écartée).
- Pas de SMS au lancement (email seul ; `SmsProvider` réutilisable plus tard).
- Pas de modification de la `WaitlistEntry` manuelle du psy.
- Pas de feature-gate par plan : disponible dès que la résa publique est active.

---

## 9. Points à trancher pendant le plan

- Réutiliser ou non le composant de sélection de slots de la résa publique pour `/rebook`.
- Confirmer qu'aucun index DB additionnel n'est nécessaire pour la requête de matching.
- Vérifier la fenêtre temporelle passée à `getAvailableTimeslots` lors de la validation du créneau libéré.
