# Video Consultation — Design Spec

**Date:** 2026-04-07
**Scope:** MVP Essentiel — visio 1-to-1 intégrée à PsyLib
**Tech:** LiveKit self-hosted sur OVH HDS (Apache 2.0, gratuit)

---

## 1. Objectif

Permettre aux psychologues de mener des consultations vidéo directement dans PsyLib, sans outil tiers, avec conformité HDS totale. Le patient rejoint via un lien unique sans téléchargement.

### Ce qu'on livre (MVP)

- Visio 1-to-1 WebRTC (psy + patient)
- Salle d'attente virtuelle avec test micro/caméra
- Notes de séance simultanées (panneau latéral pendant la visio)
- Page dédiée `/dashboard/video` (liste des visios du jour)
- Bouton "Démarrer la visio" sur les RDV dans le calendrier
- Lien patient sans app (navigateur uniquement)
- Email de notification 10 min avant le RDV
- Timer de séance visible
- Audit logs HDS (`VIDEO_CALL_START`, `VIDEO_CALL_END`)

### Ce qu'on ne livre PAS au MVP

- Sessions de groupe (couple/famille)
- Enregistrement/transcription
- Partage d'écran
- Mood check-in pré-séance
- Résumé IA automatique post-visio
- Lien paiement post-visio
- Exercice assignable depuis la visio

---

## 2. Architecture technique

### Infrastructure (OVH HDS)

```
OVH HDS VPS (Docker Compose — même machine ou VPS dédié)
├── livekit-server       (SFU WebRTC — image livekit/livekit-server)
│   ├── Port 7880 (HTTP API)
│   ├── Port 7881 (RTC/WebRTC)
│   └── Port 7882 (TURN/TCP)
├── redis                (état des rooms LiveKit)
└── caddy                (reverse proxy TLS → wss://video.psylib.eu)

Sous-domaine : video.psylib.eu → OVH HDS VPS
DNS : A record → 51.178.31.68 (ou IP dédiée si VPS séparé)
```

### Dimensionnement MVP

- 50 consultations simultanées max (100 participants, 720p)
- CPU : 4-6 vCores | RAM : 4-8 GB | Bande passante : ~50 Mbps sortant
- OVH VPS HDS : ~€80/mois (ou réutilisation du VPS existant si capacité suffisante)

### Stack logicielle

| Couche | Technologie | Package |
|---|---|---|
| Serveur vidéo | LiveKit Server | `livekit/livekit-server:latest` (Docker) |
| Backend SDK | LiveKit Node.js SDK | `livekit-server-sdk` (npm) |
| Frontend SDK | LiveKit React Components | `@livekit/components-react` + `livekit-client` |
| Signaling | WebRTC via LiveKit SFU | Intégré |
| TURN/STUN | LiveKit built-in TURN | Port 7882 TCP |
| TLS | Caddy | Reverse proxy + Let's Encrypt |

---

## 3. Modèle de données

### Migration Prisma

#### Modification de `Appointment`

```prisma
model Appointment {
  // ... champs existants ...
  isOnline    Boolean   @default(false)
  videoRoom   VideoRoom?
}
```

#### Nouvelle table `VideoRoom`

```prisma
model VideoRoom {
  id              String          @id @default(uuid())
  appointmentId   String          @unique
  appointment     Appointment     @relation(fields: [appointmentId], references: [id], onDelete: Cascade)
  roomName        String          @unique   // "psylib-{appointmentId}"
  status          VideoRoomStatus @default(waiting)
  psyJoinedAt     DateTime?
  patientJoinedAt DateTime?
  endedAt         DateTime?
  createdAt       DateTime        @default(now())

  @@index([status])
  @@index([appointmentId])
}

enum VideoRoomStatus {
  waiting    // Room créée, personne n'a rejoint
  active     // Au moins un participant dans la room
  ended      // Consultation terminée
}
```

#### Index

```sql
CREATE INDEX idx_video_rooms_status ON video_rooms(status);
CREATE INDEX idx_video_rooms_appointment ON video_rooms(appointment_id);
```

---

## 4. API Backend (NestJS — VideoModule)

### Nouveau module : `src/video/`

```
src/video/
├── video.module.ts
├── video.controller.ts
├── video.service.ts
├── dto/
│   ├── create-video-room.dto.ts
│   └── video-token.dto.ts
└── guards/
    └── video-room.guard.ts
```

### Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/video/rooms` | Psy (JWT) | Crée une room LiveKit pour un RDV |
| `GET` | `/video/rooms/:appointmentId` | Psy (JWT) | Info sur la room (statut, participants) |
| `POST` | `/video/rooms/:appointmentId/token` | Psy (JWT) | Génère un token psy pour rejoindre |
| `POST` | `/video/join/:token` | Public (rate limited) | Génère un token patient via lien unique |
| `POST` | `/video/rooms/:appointmentId/end` | Psy (JWT) | Termine la consultation |
| `GET` | `/video/today` | Psy (JWT) | Liste des visios du jour pour le psy |

### VideoService — Logique métier

```typescript
// Pseudo-code des méthodes principales

createRoom(psychologistId: string, appointmentId: string): Promise<VideoRoom>
  // 1. Vérifier que le RDV existe, appartient au psy, est isOnline
  // 2. Vérifier que le RDV est dans la fenêtre -10min / +durée
  // 3. Créer la room LiveKit via RoomServiceClient
  // 4. Persister VideoRoom en DB
  // 5. Audit log: VIDEO_ROOM_CREATED
  // 6. Retourner la VideoRoom

generatePsyToken(psychologistId: string, appointmentId: string): Promise<string>
  // 1. Vérifier ownership du RDV
  // 2. Créer AccessToken LiveKit avec permissions:
  //    - canPublish: true, canSubscribe: true
  //    - roomName: "psylib-{appointmentId}"
  //    - identity: "psy-{psychologistId}"
  //    - expiry: durée RDV + 15 min
  // 3. Audit log: VIDEO_PSY_JOIN

generatePatientToken(joinToken: string): Promise<{token: string, wsUrl: string}>
  // 1. Valider le joinToken (signé, non expiré)
  // 2. Récupérer le RDV associé
  // 3. Vérifier que la room existe et status != ended
  // 4. Créer AccessToken LiveKit avec permissions:
  //    - canPublish: true, canSubscribe: true
  //    - roomName: "psylib-{appointmentId}"
  //    - identity: "patient-{patientId}"
  //    - expiry: durée RDV + 15 min
  // 5. Audit log: VIDEO_PATIENT_JOIN

endRoom(psychologistId: string, appointmentId: string): Promise<void>
  // 1. Vérifier ownership
  // 2. Appeler LiveKit API: deleteRoom
  // 3. Mettre à jour VideoRoom: status = ended, endedAt = now()
  // 4. Audit log: VIDEO_CALL_END
  // 5. Optionnel: créer automatiquement une Session liée au RDV

getTodayRooms(psychologistId: string): Promise<VideoRoomWithAppointment[]>
  // 1. Requête: appointments du jour avec isOnline = true
  // 2. Left join VideoRoom
  // 3. Retourner avec statut enrichi
```

### Tokens de jointure patient

Le lien patient contient un **token signé HMAC-SHA256** (même pattern que `cancelToken` existant pour les annulations) :

```
https://psylib.eu/patient-portal/video/{joinToken}
```

Le `joinToken` encode : `appointmentId + patientId + expiry`. Généré quand la room est créée, envoyé par email au patient.

### Rate limiting

- `/video/join/:token` : 5 req/min par IP (protection brute-force)
- `/video/rooms` : 10 req/min par psy

---

## 5. Frontend — Pages et composants

### 5.1 Modification de `CreateAppointmentDialog`

Ajout d'un toggle/checkbox "Consultation en visio" dans le dialog existant de création de RDV.

```
[ Rechercher un patient... ]
[ Date ]  [ Heure ]
[ Durée : 30min | 45min | 60min | 90min ]
[x] Consultation en visio          ← NOUVEAU
[Créer le rendez-vous]
```

Quand coché : `isOnline: true` envoyé au `POST /appointments`.

### 5.2 Badge visio dans le calendrier

Sur chaque carte RDV dans `calendar-content.tsx` :
- Si `isOnline === true` : badge caméra (icône `Video` de Lucide) + couleur accent
- Si dans la fenêtre de lancement (10 min avant) : bouton "Démarrer la visio" visible

### 5.3 Page `/dashboard/video` — Liste des visios du jour

Layout : même structure que les autres pages dashboard (header + contenu dans card blanche).

```
┌─────────────────────────────────────────────┐
│  Consultations vidéo          Aujourd'hui ▼ │
├─────────────────────────────────────────────┤
│                                             │
│  09:00  Marie Dupont      ○ À venir         │
│         45 min            [Démarrer]        │
│                                             │
│  10:30  Jean Martin       ● Patient attend  │
│         60 min            [Rejoindre]       │
│                                             │
│  14:00  Sophie Bernard    ✓ Terminée        │
│         30 min            [Voir notes]      │
│                                             │
│  ─ Aucune autre visio aujourd'hui ─         │
└─────────────────────────────────────────────┘
```

Statuts :
- `À venir` : pas encore dans la fenêtre de lancement
- `Prêt` : dans la fenêtre (-10 min), room pas encore créée
- `Patient attend` : le patient est dans la salle d'attente
- `En cours` : les deux sont connectés
- `Terminée` : consultation finie

### 5.4 Salle de consultation — Psy (`/dashboard/video/[roomId]`)

Layout split-screen :

```
┌──────────────────────────────────┬──────────────────┐
│                                  │  Notes de séance │
│                                  │                  │
│     Vidéo patient                │  [Éditeur rich   │
│     (plein panneau)              │   text avec      │
│                                  │   autosave 30s]  │
│                                  │                  │
│              ┌────────┐          │                  │
│              │Mini psy│          │                  │
│              └────────┘          │                  │
├──────────────────────────────────┤                  │
│  🎤  📷  ⏱ 23:45  │ Terminer │  │                  │
└──────────────────────────────────┴──────────────────┘
```

- **Panneau vidéo (gauche, ~65%)** : flux patient en grand, miniature psy en PiP
- **Panneau notes (droite, ~35%)** : réutilise `session-note-editor.tsx` existant, rétractable via un bouton toggle
- **Barre de contrôle (bas)** : toggle micro, toggle caméra, timer, bouton "Terminer la consultation"
- **Timer** : compte le temps depuis le début de la consultation, change de couleur quand on dépasse la durée prévue du RDV
- **Responsive** : sur mobile, le panneau notes est un drawer bottom-sheet

### 5.5 Salle d'attente — Patient (`/patient-portal/video/[token]`)

Page publique (protégée par le token signé, pas besoin de login patient).

```
┌─────────────────────────────────────────────┐
│              PsyLib                         │
├─────────────────────────────────────────────┤
│                                             │
│         ┌──────────────┐                    │
│         │  Aperçu      │                    │
│         │  caméra      │                    │
│         │  (preview)   │                    │
│         └──────────────┘                    │
│                                             │
│    🎤 Micro OK    📷 Caméra OK             │
│                                             │
│    Votre psychologue va vous recevoir       │
│    dans quelques instants...                │
│                                             │
│    ● En attente                             │
│                                             │
└─────────────────────────────────────────────┘
```

Flow :
1. Le patient ouvre le lien → test auto micro/caméra → preview
2. Le `POST /video/join/:token` valide le token et connecte au LiveKit room
3. Le patient attend (status `waiting` dans la room)
4. Quand le psy rejoint, la consultation démarre automatiquement
5. Quand le psy termine, le patient voit "La consultation est terminée" + bouton retour portail

### 5.6 Hook `useVideoCall`

Nouveau hook React basé sur `@livekit/components-react` :

```typescript
useVideoCall({
  roomName: string,
  token: string,
  serverUrl: string,  // wss://video.psylib.eu
  onConnected: () => void,
  onDisconnected: () => void,
  onParticipantJoined: (participant) => void,
  onParticipantLeft: (participant) => void,
})
```

Retourne : `{ isConnected, participants, localParticipant, toggleMic, toggleCamera, disconnect }`

---

## 6. Email de notification

Template React Email (Resend) : `video-consultation-link.tsx`

Envoyé **10 minutes avant le RDV** via un job BullMQ (même pattern que les rappels de RDV existants).

```
Sujet : Votre consultation vidéo dans 10 minutes

Bonjour {patientName},

Votre consultation vidéo avec {psychologistName} commence à {time}.

[Rejoindre la consultation]  ← bouton principal

Aucune application à installer — le lien s'ouvre dans votre navigateur.

Conseils :
• Installez-vous dans un endroit calme et privé
• Vérifiez que votre micro et caméra fonctionnent
• Utilisez Chrome, Firefox ou Safari à jour

En cas de problème technique, contactez votre psychologue.
```

---

## 7. Sécurité & Conformité HDS

### Données

| Donnée | Stockage | Chiffrement |
|---|---|---|
| Flux vidéo/audio | Temps réel uniquement (SFU) | DTLS-SRTP (WebRTC natif) |
| Métadonnées room | PostgreSQL (OVH HDS) | At-rest (RDS) |
| Token de jointure | URL signée HMAC-SHA256 | En transit (TLS 1.3) |
| Notes de séance | PostgreSQL (OVH HDS) | AES-256-GCM (applicatif) |

### Audit logs

| Action | Quand | Données loguées |
|---|---|---|
| `VIDEO_ROOM_CREATED` | Room créée | appointmentId, psychologistId |
| `VIDEO_PSY_JOIN` | Psy rejoint | roomId, psychologistId, IP |
| `VIDEO_PATIENT_JOIN` | Patient rejoint | roomId, patientId, IP |
| `VIDEO_CALL_END` | Consultation terminée | roomId, duration, psychologistId |

### Isolation

- Chaque room est nommée `psylib-{appointmentId}` — unicité garantie
- Les tokens LiveKit sont scoped à une seule room avec expiration
- Le patient ne peut voir que sa propre room (validation serveur du token)
- Aucun enregistrement au MVP — les flux vidéo ne sont jamais persistés

### CORS & réseau

- LiveKit server : CORS restreint à `psylib.eu` et `www.psylib.eu`
- Caddy reverse proxy : TLS 1.3, HSTS, headers de sécurité
- TURN intégré : fallback TCP sur port 7882 si UDP bloqué (réseaux d'entreprise)

---

## 8. Intégration avec l'existant

### Liens avec les features PsyLib existantes

| Feature existante | Intégration visio |
|---|---|
| **Calendrier** | Badge caméra + bouton "Démarrer" sur RDV isOnline |
| **CreateAppointmentDialog** | Checkbox "Consultation en visio" |
| **Session notes** | Panneau latéral dans la salle de consultation |
| **Patient portal** | Page salle d'attente + notification "visio dans 10 min" |
| **Emails (Resend)** | Nouveau template `video-consultation-link` |
| **BullMQ** | Job `send-video-link` 10 min avant le RDV |
| **Audit logs** | 4 nouveaux événements VIDEO_* |
| **Socket.io** | Non utilisé pour la visio (LiveKit gère son propre signaling) |

### Sidebar dashboard

Ajout d'un item "Visio" dans la sidebar avec icône `Video` (Lucide), entre "Calendrier" et "Assistant IA".

---

## 9. Docker Compose — LiveKit sur OVH HDS

```yaml
# docker-compose.livekit.yml (sur le VPS OVH HDS)
version: '3.8'

services:
  livekit:
    image: livekit/livekit-server:latest
    restart: unless-stopped
    ports:
      - "7880:7880"   # HTTP API
      - "7881:7881"   # RTC (WebRTC)
      - "7882:7882"   # TURN TCP
    environment:
      - LIVEKIT_CONFIG=/etc/livekit.yaml
    volumes:
      - ./livekit.yaml:/etc/livekit.yaml:ro
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis-data:/data

  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy-data:/data

volumes:
  redis-data:
  caddy-data:
```

### livekit.yaml (config)

```yaml
port: 7880
rtc:
  port_range_start: 7881
  port_range_end: 7881
  use_external_ip: true
redis:
  address: redis:6379
keys:
  # Clé API + secret pour générer les tokens côté NestJS
  APIxxxxxx: secretxxxxxx
turn:
  enabled: true
  domain: video.psylib.eu
  tls_port: 7882
logging:
  level: info
```

---

## 10. Dépendances npm

### Backend (`apps/api`)

```
livekit-server-sdk    # Création rooms + génération tokens
```

### Frontend (`apps/web`)

```
@livekit/components-react    # Composants React préfaits
livekit-client               # Client WebRTC bas niveau
```

---

## 11. Variables d'environnement

### Backend (.env)

```env
LIVEKIT_API_KEY=APIxxxxxx
LIVEKIT_API_SECRET=secretxxxxxx
LIVEKIT_WS_URL=wss://video.psylib.eu
VIDEO_JOIN_SECRET=hmac-secret-for-patient-tokens
```

### Frontend (.env)

```env
NEXT_PUBLIC_LIVEKIT_WS_URL=wss://video.psylib.eu
```

---

## 12. Résumé des livrables

| # | Livrable | Fichiers principaux |
|---|---|---|
| 1 | Infrastructure LiveKit | `docker-compose.livekit.yml`, `livekit.yaml`, `Caddyfile` |
| 2 | Migration Prisma | `schema.prisma` (Appointment.isOnline + VideoRoom) |
| 3 | VideoModule NestJS | `video.module.ts`, `video.service.ts`, `video.controller.ts` |
| 4 | Modification Appointment DTO | `appointment.dto.ts` (ajout `isOnline`) |
| 5 | Hook useVideoCall | `hooks/use-video-call.ts` |
| 6 | Page `/dashboard/video` | `app/(dashboard)/video/page.tsx` |
| 7 | Salle consultation psy | `app/(dashboard)/video/[roomId]/page.tsx` |
| 8 | Salle d'attente patient | `app/(patient-portal)/video/[token]/page.tsx` |
| 9 | Composants vidéo | `components/video/` (VideoRoom, WaitingRoom, Controls, Timer) |
| 10 | Badge calendrier | `calendar-content.tsx` (modification) |
| 11 | Checkbox visio | `create-appointment-dialog.tsx` (modification) |
| 12 | Sidebar item | `sidebar.tsx` (modification) |
| 13 | Email template | `video-consultation-link.tsx` |
| 14 | Job BullMQ | `send-video-link.job.ts` |
| 15 | Shared types | `packages/shared-types` (VideoRoom, VideoRoomStatus) |
| 16 | Tests | Vitest (VideoService) + Playwright (flow E2E) |
