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
- Consentement RGPD `video_consultation` avant première visio
- Feature-gated Pro/Clinic (via `@RequirePlan`)

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
| Serveur vidéo | LiveKit Server | `livekit/livekit-server:v1.8` (Docker, version pinnée) |
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
  psychologistId  String          @map("psychologist_id")  // Tenant isolation directe
  psychologist    Psychologist    @relation(fields: [psychologistId], references: [id])
  roomName        String          @unique   // "psylib-{appointmentId}"
  status          VideoRoomStatus @default(waiting)
  psyJoinedAt     DateTime?
  patientJoinedAt DateTime?
  endedAt         DateTime?
  createdAt       DateTime        @default(now())

  @@index([psychologistId, status])
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

### Feature gating

La visio est disponible uniquement pour les plans **Pro** et **Clinic**.

```typescript
@UseGuards(SubscriptionGuard)
@RequirePlan(SubscriptionPlan.PRO, SubscriptionPlan.CLINIC)
@Controller('video')
export class VideoController { ... }
```

Ajout de `'video'` au type `BillingFeature` dans `require-plan.decorator.ts`.

### Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/video/rooms` | Psy (JWT) + Pro/Clinic | Crée une room LiveKit pour un RDV |
| `GET` | `/video/rooms/:appointmentId` | Psy (JWT) | Info sur la room (statut, participants) |
| `POST` | `/video/rooms/:appointmentId/token` | Psy (JWT) | Génère un token psy pour rejoindre |
| `POST` | `/video/join/:token` | Public (rate limited) | Génère un token patient via lien unique |
| `POST` | `/video/rooms/:appointmentId/end` | Psy (JWT) | Termine la consultation |
| `GET` | `/video/today` | Psy (JWT) | Liste des visios du jour pour le psy |

### Gestion des erreurs

| Cas | HTTP | Exception |
|---|---|---|
| RDV inexistant | 404 | `NotFoundException('Rendez-vous introuvable')` |
| RDV pas `isOnline` | 400 | `BadRequestException('Ce rendez-vous n\'est pas en visio')` |
| RDV annulé/terminé | 400 | `BadRequestException('Ce rendez-vous est annulé ou terminé')` |
| Room déjà existante | 200 | Retour idempotent de la room existante |
| Hors fenêtre horaire | 400 | `BadRequestException('La visio ne peut être démarrée que 10 min avant le RDV')` |
| Token patient invalide | 401 | `UnauthorizedException('Lien de visio invalide ou expiré')` |
| Plan insuffisant | 403 | `ForbiddenException('La visio nécessite un abonnement Pro ou Clinic')` |

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
  // 1. Valider le joinToken HMAC (signé, non expiré — expiry: 24h après le RDV)
  // 2. Récupérer le RDV associé
  // 3. Vérifier que la room existe et status != ended
  // 4. Vérifier consentement RGPD `video_consultation` pour ce patient
  //    - Si pas de consentement → retourner { needsConsent: true }
  // 5. Créer un NOUVEAU AccessToken LiveKit (frais à chaque appel) :
  //    - canPublish: true, canSubscribe: true
  //    - roomName: "psylib-{appointmentId}"
  //    - identity: "patient-{patientId}"
  //    - expiry: durée RDV + 30 min (depuis maintenant, PAS depuis la création room)
  // 6. Audit log: VIDEO_PATIENT_JOIN
  //
  // NOTE: Le joinToken HMAC dans l'URL est longue durée (24h).
  // Le LiveKit AccessToken est généré frais à chaque appel pour éviter l'expiration mid-session.

endRoom(psychologistId: string, appointmentId: string): Promise<void>
  // 1. Vérifier ownership (psychologistId sur VideoRoom)
  // 2. Appeler LiveKit API: deleteRoom
  // 3. Mettre à jour VideoRoom: status = ended, endedAt = now()
  // 4. Mettre à jour Appointment: status = completed
  // 5. Créer automatiquement une Session liée au RDV si aucune n'existe :
  //    - type: 'online', duration: calculée depuis psyJoinedAt
  //    - notes: vides (le psy peut les avoir remplies dans le panneau latéral)
  //    - Lier via appointment.sessionId
  // 6. Audit log: VIDEO_CALL_END (avec durée)

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

**Distinction joinToken vs LiveKit AccessToken :**

| Token | Type | Durée de vie | Usage |
|---|---|---|---|
| `joinToken` (URL) | HMAC-SHA256 | 24h après le RDV | Identifier le patient + autoriser l'accès à la page |
| LiveKit `AccessToken` | JWT LiveKit | durée RDV + 30 min (depuis génération) | Accès au flux WebRTC |

Le `joinToken` dans l'URL est longue durée — il permet au patient de revenir si la connexion coupe. Le LiveKit `AccessToken` est généré **frais à chaque appel** à `POST /video/join/:token`, ce qui évite l'expiration mid-session et permet la reconnexion.

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
1. Le patient ouvre le lien → **écran de consentement RGPD** si première visio (type `video_consultation`)
2. Test auto micro/caméra → preview
3. Le `POST /video/join/:token` valide le token, vérifie le consentement, et génère un LiveKit AccessToken frais
4. Le patient attend (status `waiting` dans la room)
5. Quand le psy rejoint, la consultation démarre automatiquement
6. Quand le psy termine, le patient voit "La consultation est terminée" + bouton retour portail

**Reconnexion :** si le patient perd la connexion, il peut rouvrir le même lien. Un nouveau LiveKit AccessToken est généré via `POST /video/join/:token` (le joinToken HMAC reste valide 24h).

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

Retourne : `{ isConnected, participants, localParticipant, toggleMic, toggleCamera, disconnect, connectedAt, isReconnecting }`

### 5.7 Reconnexion & gestion des erreurs réseau

- **Auto-reconnexion** : LiveKit client a un mécanisme de reconnexion intégré (3 tentatives, backoff exponentiel). Le hook expose `isReconnecting` pour afficher un indicateur visuel.
- **Psy ferme l'onglet** : le patient voit "Votre psychologue s'est déconnecté. Il peut revenir dans quelques instants." (pas de fermeture automatique de la room)
- **Patient perd la connexion** : le psy voit "Le patient s'est déconnecté" avec un timer. Si le patient ne revient pas après 5 min, notification "Le patient ne semble pas pouvoir se reconnecter."
- **Rooms orphelines** : un cron job NestJS toutes les 15 min vérifie les rooms `active` dont le dernier heartbeat LiveKit date de >15 min → passage automatique en `ended` + audit log `VIDEO_ROOM_ORPHAN_CLEANUP`

---

## 6. Email de notification

Template React Email (Resend) : `video-consultation-link.tsx`

Envoyé **10 minutes avant le RDV** via un job BullMQ avec `delay` calculé.

### Scheduling du job

- À la création d'un RDV avec `isOnline: true` → ajouter un job BullMQ `send-video-link` avec `delay: scheduledAt - 10min - now()` (millisecondes)
- Si le RDV est modifié (`PUT /appointments/:id`) et que `isOnline` change ou que `scheduledAt` change → supprimer l'ancien job + en créer un nouveau
- Si le RDV est annulé → supprimer le job
- Ajout d'un champ `videoLinkSentAt DateTime?` sur `Appointment` pour tracker l'envoi

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

### Consentement RGPD vidéo

Nouveau type de consentement dans `gdpr_consents` : `video_consultation`

Le patient doit consentir **avant sa première visio** :
- Écran de consentement dans la salle d'attente (avant le test micro/caméra)
- Texte : "En rejoignant cette consultation vidéo, vous autorisez le traitement de votre image et votre voix en temps réel sur une infrastructure certifiée HDS en France. Aucun enregistrement n'est effectué."
- Le consentement est enregistré dans `gdpr_consents` (type: `video_consultation`, version: `2026-04-v1`)
- Le consentement est vérifié côté serveur dans `generatePatientToken`

### CSP & Permissions-Policy (next.config.mjs)

Modifications nécessaires :
- `connect-src` : ajouter `wss://video.psylib.eu https://video.psylib.eu`
- `Permissions-Policy` : pour les routes `/dashboard/video/*` et `/patient-portal/video/*`, changer `camera=()` et `microphone=()` en `camera=(self)` et `microphone=(self)`
- Implémenter via un middleware conditionnel ou des headers route-spécifiques dans `next.config.mjs`

### Middleware (middleware.ts)

Ajouter `/patient-portal/video/(.*)` à la liste des routes publiques (même pattern que `/appointments/cancel/(.*)`) pour que les patients sans compte PsyLib puissent accéder à la salle d'attente via le lien signé.

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
| **BullMQ** | Job `send-video-link` schedulé avec `delay` à la création du RDV |
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
    image: livekit/livekit-server:v1.8    # Version pinnée
    restart: unless-stopped
    network_mode: host    # Requis pour WebRTC UDP (accès direct aux ports)
    # Ports utilisés : 7880 (HTTP API), 7881 (RTC signaling),
    # 50000-50200 (UDP media), 7882 (TURN TCP)
    environment:
      - LIVEKIT_CONFIG=/etc/livekit.yaml
    volumes:
      - ./livekit.yaml:/etc/livekit.yaml:ro
    depends_on:
      - redis

  redis:
    image: redis:7.4-alpine    # Version pinnée
    restart: unless-stopped
    volumes:
      - redis-data:/data

  caddy:
    image: caddy:2.8-alpine    # Version pinnée
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
  udp_port: 7881
  port_range_start: 50000
  port_range_end: 50200    # 200 ports UDP pour ~100 sessions simultanées
  use_external_ip: true
redis:
  address: localhost:6379    # network_mode: host → localhost
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

> **Note :** `network_mode: host` est utilisé pour le container LiveKit afin d'éviter le NAT Docker sur les ports UDP media. Les ports 50000-50200/UDP + 7880-7882 doivent être ouverts dans le firewall OVH.

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
| 2 | Migration Prisma | `schema.prisma` (Appointment.isOnline/videoLinkSentAt + VideoRoom + gdpr_consents type) |
| 3 | VideoModule NestJS | `video.module.ts`, `video.service.ts`, `video.controller.ts` |
| 4 | Feature gating | `require-plan.decorator.ts` (ajout `'video'` à BillingFeature) |
| 5 | Modification Appointment DTO + Service | `appointment.dto.ts` (ajout `isOnline`), scheduling BullMQ |
| 6 | Hook useVideoCall | `hooks/use-video-call.ts` |
| 7 | Page `/dashboard/video` | `app/(dashboard)/video/page.tsx` |
| 8 | Salle consultation psy | `app/(dashboard)/video/[roomId]/page.tsx` |
| 9 | Salle d'attente patient | `app/(patient-portal)/video/[token]/page.tsx` |
| 10 | Composants vidéo | `components/video/` (VideoRoom, WaitingRoom, Controls, Timer, ConsentScreen) |
| 11 | Badge calendrier | `calendar-content.tsx` (modification) |
| 12 | Checkbox visio | `create-appointment-dialog.tsx` (modification) |
| 13 | Sidebar item | `sidebar.tsx` (modification) |
| 14 | Email template | `video-consultation-link.tsx` |
| 15 | Job BullMQ | `send-video-link.job.ts` |
| 16 | Shared types | `packages/shared-types` (VideoRoom, VideoRoomStatus) |
| 17 | CSP & Permissions-Policy | `next.config.mjs` (connect-src + camera/microphone permissions) |
| 18 | Middleware route publique | `middleware.ts` (whitelist `/patient-portal/video/(.*)`) |
| 19 | Cron rooms orphelines | `video-cleanup.cron.ts` (nettoyage rooms active >15 min sans heartbeat) |
| 20 | Tests | Vitest (VideoService) + Playwright (flow E2E) |
