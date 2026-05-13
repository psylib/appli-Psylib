# Visio Instantanee — Design Spec

**Date:** 2026-05-13
**Status:** Approved
**Feature:** Lancer une visio sans RDV prealable, en envoyant un simple lien

---

## Contexte

Actuellement, une consultation video necessite un Appointment avec `is_online = true`. Le psy doit creer un RDV dans l'agenda, attendre la fenetre horaire (10min avant), puis demarrer la visio. Ce flow est inadapte pour les visios spontanees.

**Cas d'usage :** Un psy veut appeler un patient maintenant, sans avoir planifie de RDV. Il clique "Visio instantanee", choisit optionnellement un patient, et partage le lien.

## Approche

Reutiliser le flow Appointment/VideoRoom existant. Un endpoint `POST /video/instant` cree un Appointment "instantane" (`source = "instant"`) + un VideoRoom LiveKit en une seule operation. Pas de nouvelle table.

## Design detaille

### 1. Schema — Migration

**Rendre `patient_id` nullable sur `appointments`:**

```prisma
model Appointment {
  patientId String? @map("patient_id")  // nullable pour visio sans patient
  patient   Patient? @relation(...)     // relation optionnelle
  // ...
}
```

Migration SQL:
```sql
ALTER TABLE appointments ALTER COLUMN patient_id DROP NOT NULL;
```

**Impact complet du nullable patientId — Fichiers a modifier avec null guards:**

| Fichier | Code impacte | Fix |
|---------|-------------|-----|
| `video.service.ts` — `endRoom()` | `patientId: room.appointment.patientId` pour Session | Wrapper: `if (room.appointment.patientId) { ... }` |
| `video.service.ts` — `generatePatientToken()` | `appointment.patient.id`, `.name` | Null guard: si `appointment.patient` est null, utiliser `patientName = "Participant"` |
| `video.service.ts` — `recordConsent()` | `patientId: appointment.patientId` pour GdprConsent | Skip consent creation si `patientId` est null (pas de patient = pas de consent) |
| `video.service.ts` — `getTodayRooms()` | `appt.patient.name` | Null guard: `patientName: appt.patient?.name ?? "Visio libre"` |
| `video.dto.ts` — `TodayVideoRoom` | `patientName: string` | Changer en `patientName: string \| null` |
| `reminder.service.ts` | `appt.patient.name` dans cron | Ajouter `patientId: { not: null }` au WHERE |
| `calendar-sync.service.ts` | `appointment.patient.name` sur event | Guard null: `appointment.patient?.name ?? "Visio instantanee"` |
| `appointments.service.ts` | Cancel/confirm flows accedent `appointment.patient.*` | Ajouter null guards |
| `subscription.service.ts` | Refs `appointment.patient.email`, `.name` | Ajouter null guards |
| Frontend `video/page.tsx` | `room.patientName` rendu | `room.patientName ?? "Visio libre"` |

**Events:** NE PAS emettre `appointment.created` pour les instant rooms (pas de sync Google Calendar, pas de reminder). Filtrer dans les event listeners avec `source !== "instant"`.

### 2. Backend — Endpoint `POST /video/instant`

**Controller:** `VideoController`
**Guard:** KeycloakGuard + RolesGuard(psychologist) + SubscriptionGuard + RequireFeature('video')
**Rate limit:** `@Throttle({ default: { limit: 10, ttl: 60000 } })` (max 10/min)

**Input DTO:**
```typescript
class CreateInstantVideoDto {
  @IsOptional()
  @IsUUID()
  patientId?: string;
}
```

**Flow:**
1. Verifier que le psy existe et a le feature `video` (Solo+)
2. Si `patientId` fourni: verifier que le patient appartient au psy (tenant isolation)
3. Creer un `Appointment` (dans un try/catch — rollback si LiveKit echoue):
   - `psychologistId`: psy.id
   - `patientId`: dto.patientId ?? null
   - `scheduledAt`: new Date() (maintenant)
   - `duration`: 120 (2h max)
   - `status`: "confirmed"
   - `isOnline`: true
   - `source`: "instant"
   - `videoJoinToken`: **`crypto.randomUUID()`** (IMPORTANT: pas randomBytes — le controller utilise ParseUUIDPipe)
4. Creer le `VideoRoom` LiveKit:
   - roomName: `psylib-{appointmentId}`
   - emptyTimeout: 300s
   - Si LiveKit echoue: supprimer l'appointment et throw
5. Generer le token psy (AccessToken LiveKit, ttl 150min = 2h30)
6. Audit log: `VIDEO_INSTANT_CREATED`
7. Retourner:
   ```json
   {
     "appointmentId": "uuid",
     "token": "livekit-jwt-psy",
     "wsUrl": "wss://...",
     "roomName": "psylib-xxx",
     "patientLink": "https://psylib.eu/patient-portal/video/UUID_TOKEN",
     "durationMin": 120
   }
   ```

### 3. Backend — Modifications existantes

**`VideoService.createRoom()`:**
- Si `appointment.source === "instant"`, bypass la verification de fenetre horaire

**`VideoService.endRoom()`:**
- Guard: `if (room.appointment.patientId)` avant de creer la Session auto
- Sans patient: marquer l'appointment `completed`, fermer le room, pas de Session

**`VideoService.generatePatientToken()`:**
- Null guard sur `appointment.patient`: si null, utiliser `patientName = "Participant"`, `patientId = "anonymous"`
- Skip GDPR consent check si `patientId` est null (pas de patient = consent non applicable)

**`VideoService.recordConsent()`:**
- Si `appointment.patientId` est null: skip la creation GdprConsent (retourner sans erreur)

**`VideoService.getTodayRooms()`:**
- Inclure les visios instantanees du jour
- `patientName: appt.patient?.name ?? null` (frontend affiche "Visio libre")

**`ReminderService`:**
- Ajouter `patientId: { not: null }` au WHERE pour exclure les instant rooms

**`CalendarSyncService`:**
- Ne pas sync les appointments avec `source === "instant"`

**`AppointmentsService` / Calendar:**
- Filtrer `source !== "instant"` dans les vues calendrier par defaut
- Ajouter null guards sur `appointment.patient.*` dans cancel/confirm

### 4. Frontend — Page Video (`/dashboard/video`)

**Bouton "Nouvelle visio"** en haut a droite de la page:
- Ouvre un dialog modal simple
- Combobox patient avec recherche (optionnel, placeholder "Sans patient")
- Bouton "Demarrer la visio"
- Au clic: `POST /video/instant` -> redirect vers `/video/{appointmentId}`

### 5. Frontend — Salle de visio (`/video/[appointmentId]`)

**Bandeau lien patient:**
- Affiche quand `source === "instant"` et patient pas encore rejoint
- Texte: "Partagez ce lien avec votre patient"
- Input readonly avec le lien + bouton "Copier"
- Disparait quand le patient rejoint (notification realtime existante)

### 6. Feature Gate

Meme que la visio classique: **Solo, Pro, Clinic** (pas Free).

### 7. Securite & HDS

- Audit log `VIDEO_INSTANT_CREATED` a la creation
- Les audit logs existants (VIDEO_PSY_JOIN, VIDEO_PATIENT_JOIN, VIDEO_CALL_END) s'appliquent
- Le `videoJoinToken` utilise `crypto.randomUUID()` (compatible ParseUUIDPipe)
- Consent RGPD video: le flow patient existant s'applique quand `patientId` est non-null. Sans patient, pas de consent (pas de donnee patient stockee)
- Le lien expire quand le room est ferme (status `ended`)
- Rate limit: max 10 creations/minute par psy

### 8. Edge Cases

- **Psy ferme le navigateur sans terminer:** le cron `cleanupOrphanedRooms` nettoie apres 15min sans participants
- **Patient n'a pas de compte:** pas besoin, le flow `/patient-portal/video/:joinToken` ne requiert pas de connexion
- **Visio sans patient + fin de visio:** pas de Session auto-creee, le psy peut en creer une manuellement
- **Multiple visios instantanees:** chacune est un Appointment/VideoRoom distinct
- **LiveKit echoue a la creation:** l'appointment est supprime (rollback), erreur retournee au psy
- **Appointment.source string:** valeurs valides = `"internal"`, `"public"`, `"instant"` (pas d'enum DB, commentaire schema)

### 9. Fichiers a modifier

**Backend (apps/api):**
- `src/video/video.service.ts` — ajouter `createInstantRoom()`, modifier `createRoom()`, `endRoom()`, `generatePatientToken()`, `recordConsent()`, `getTodayRooms()`
- `src/video/video.controller.ts` — ajouter endpoint `POST /video/instant`
- `src/video/dto/video.dto.ts` — ajouter `CreateInstantVideoDto`, rendre `patientName` nullable dans `TodayVideoRoom`
- `src/reminder/reminder.service.ts` — exclure instant rooms du WHERE
- `src/calendar-sync/calendar-sync.service.ts` — ne pas sync instant rooms
- `src/appointments/appointments.service.ts` — null guards patient, filtrer instant du calendrier
- `prisma/schema.prisma` — `patientId` nullable sur Appointment, relation `Patient?`
- Migration SQL

**Frontend (apps/web):**
- `src/app/(dashboard)/dashboard/video/page.tsx` — bouton + dialog "Nouvelle visio", null guard patientName
- `src/app/(dashboard)/video/[roomId]/page.tsx` — bandeau lien patient
- `src/lib/api/video.ts` — ajouter `createInstantRoom()`
