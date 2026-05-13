# Visio Instantanee — Design Spec

**Date:** 2026-05-13
**Status:** Draft
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
  // ...
}
```

Migration SQL:
```sql
ALTER TABLE appointments ALTER COLUMN patient_id DROP NOT NULL;
```

**Impact:** Tous les endroits qui lisent `appointment.patientId` doivent gerer le `null`. Points critiques:
- `VideoService.endRoom()` — ne cree une Session que si `patientId` est non-null
- `VideoService.generatePatientToken()` — inchange (utilise `videoJoinToken` pas `patientId`)
- `VideoService.getTodayRooms()` — afficher "Sans patient" si `patientId` est null
- `AppointmentsService` — les queries existantes qui joignent `patient` doivent utiliser LEFT JOIN (Prisma gere auto avec la relation optionnelle)

### 2. Backend — Endpoint `POST /video/instant`

**Controller:** `VideoController`
**Guard:** KeycloakGuard + RolesGuard(psychologist) + SubscriptionGuard + RequireFeature('video')

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
3. Creer un `Appointment`:
   - `psychologistId`: psy.id
   - `patientId`: dto.patientId ?? null
   - `scheduledAt`: new Date() (maintenant)
   - `duration`: 120 (2h max)
   - `status`: "confirmed"
   - `isOnline`: true
   - `source`: "instant"
   - `videoJoinToken`: crypto.randomBytes(32).toString('hex')
4. Creer le `VideoRoom` LiveKit:
   - roomName: `psylib-{appointmentId}`
   - emptyTimeout: 300s
5. Generer le token psy (AccessToken LiveKit)
6. Audit log: `VIDEO_INSTANT_CREATED`
7. Retourner:
   ```json
   {
     "appointmentId": "uuid",
     "token": "livekit-jwt-psy",
     "wsUrl": "wss://...",
     "roomName": "psylib-xxx",
     "patientLink": "https://psylib.eu/patient-portal/video/VIDEO_JOIN_TOKEN",
     "durationMin": 120
   }
   ```

### 3. Backend — Modifications existantes

**`VideoService.createRoom()`:**
- Ajouter: si `appointment.source === "instant"`, bypass la verification de fenetre horaire

**`VideoService.endRoom()`:**
- Si `appointment.patientId === null`: ne PAS creer de Session auto
- Si `appointment.patientId !== null`: creer la Session comme d'habitude

**`VideoService.getTodayRooms()`:**
- Inclure les visios instantanees dans la liste du jour
- Afficher "Visio libre" au lieu du nom patient si `patientId` est null

**`AppointmentsService` / Calendar:**
- Filtrer `source !== "instant"` dans les vues calendrier par defaut pour ne pas polluer l'agenda

### 4. Frontend — Page Video (`/dashboard/video`)

**Bouton "Nouvelle visio"** en haut a droite de la page:
- Ouvre un dialog modal simple
- Combobox patient avec recherche (optionnel, placeholder "Sans patient")
- Bouton "Demarrer la visio"
- Au clic: `POST /video/instant` → redirect vers `/video/{appointmentId}`

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
- Le `videoJoinToken` est un token cryptographique unique (32 bytes, hex)
- Consent RGPD video: le flow patient existant s'applique (consent avant de rejoindre)
- Le lien expire quand le room est ferme (status `ended`)

### 8. Edge Cases

- **Psy ferme le navigateur sans terminer:** le cron `cleanupOrphanedRooms` nettoie apres 15min sans participants
- **Patient n'a pas de compte:** pas besoin, le flow `/patient-portal/video/:joinToken` ne requiert pas de connexion
- **Visio sans patient + fin de visio:** pas de Session auto-creee, le psy peut en creer une manuellement si besoin
- **Multiple visios instantanees:** le psy peut en creer plusieurs, chacune est un Appointment/VideoRoom distinct

### 9. Fichiers a modifier

**Backend (apps/api):**
- `src/video/video.service.ts` — ajouter `createInstantRoom()`, modifier `createRoom()`, `endRoom()`, `getTodayRooms()`
- `src/video/video.controller.ts` — ajouter endpoint `POST /video/instant`
- `src/video/dto/video.dto.ts` — ajouter `CreateInstantVideoDto`
- `prisma/schema.prisma` — `patientId` nullable sur Appointment
- Migration SQL

**Frontend (apps/web):**
- `src/app/(dashboard)/dashboard/video/page.tsx` — bouton + dialog "Nouvelle visio"
- `src/app/(dashboard)/video/[roomId]/page.tsx` — bandeau lien patient
- `src/lib/api/video.ts` — ajouter `createInstantRoom()`
- `src/components/patients/patient-search-combobox.tsx` — nouveau composant (optionnel, peut etre inline)

**Pas de nouveaux fichiers de test** dans ce scope (existants couvrent deja le flow video).
