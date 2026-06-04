# AI Scribe — Spec Design
**Date :** 2026-06-04
**Plan gate :** Pro + Clinic
**Statut :** Approuvé

---

## Objectif

Générer automatiquement une note clinique structurée après chaque visio, à partir de la transcription audio de la séance. Différenciateur fort : aucun concurrent FR ne propose ça aux psys. Gain estimé : 15-20 min de paperasse par séance.

---

## Flow utilisateur

```
Psy ouvre la visio (Pro+)
  └─ Bouton "Scribe IA" dans les contrôles vidéo
       ├─ Grisé si patient n'a pas encore consenti (tooltip explicatif)
       └─ Actif si patient a consenti à "ai_video_transcription"

Patient rejoint via son lien habituel
  └─ Page consentement existante : + nouvelle case
       "J'accepte que cette séance soit transcrite par IA
        pour aider mon psychologue à rédiger sa note clinique."
       (opt-in, non bloquant — peut rejoindre sans cocher)

Les deux ont consenti → psy active le toggle
  └─ Browser commence l'enregistrement audio mixé
       (micro psy + audio patient via Web Audio API → MediaRecorder → WebM/Opus)

Psy clique "Terminer la séance"
  └─ endRoom() appelé
  └─ Audio blob uploadé automatiquement vers API (si scribe activé)
  └─ BullMQ job créé : transcription + génération note

~60s plus tard
  └─ Session créée avec note pré-remplie
  └─ Notification in-app : "Votre note a été générée par le Scribe IA"
  └─ Psy retrouve la note sur la fiche de séance (brouillon éditable)
```

---

## Architecture technique

### 1. Capture audio (frontend)

Hook `useScribeRecorder` :

```
AudioContext
  ├── MediaStreamAudioSourceNode (micro local — localParticipant)
  ├── MediaStreamAudioSourceNode (audio remote participants)
  └── MediaStreamDestinationNode
        └── MediaRecorder (WebM/Opus, 32kbps)
              └── Blob chunks accumulés en mémoire
```

- Format : WebM/Opus (natif Chrome/Firefox, accepté par Whisper)
- Durée max séance : 2h → ~28MB à 32kbps → sous la limite Whisper (25MB)
- Sécurité : si >24MB, on sérialise en 2 chunks uploadés séquentiellement
- Enregistrement démarre seulement quand `scribe_enabled = true`
- Stop automatique sur disconnect LiveKit

### 2. Upload audio (frontend → API)

Déclenché dans `endRoom()` côté client si scribe actif :
- `POST /video/rooms/:appointmentId/scribe/audio` (multipart/form-data)
- Champ `audio` : Blob WebM
- Authentification psy requise (JWT Keycloak)
- Rate limit : 3 req/min (throttle Nest)
- Taille max : 25MB (validée côté API, 413 sinon)

### 3. Processing async (BullMQ)

Job `scribe-process` déclenché après upload réussi :

```
1. Télécharger l'audio depuis stockage temp (ou passer le buffer)
2. POST https://api.openai.com/v1/audio/transcriptions
     model: whisper-1
     language: fr
     response_format: verbose_json
3. Extraire le transcript texte
4. POST OpenRouter → claude-sonnet-4
     prompt: voir section "Format de note"
5. Parser le JSON de réponse
6. Chiffrer le transcript (AES-256-GCM)
7. Sauvegarder dans session:
     - scribe_transcript (chiffré)
     - summary_ai (note structurée, chiffré)
     - notes pré-remplis avec le contenu si vides
8. Mettre à jour video_room.scribe_status = 'done'
9. Créer notification in-app pour le psy
10. Log audit : AI_SCRIBE_COMPLETE
```

En cas d'échec : `scribe_status = 'failed'`, notification psy avec message d'erreur clair.

### 4. Format de note (prompt Claude)

**System prompt :**
```
Tu es un assistant pour psychologue. Tu reçois la transcription brute d'une séance.
Génère une note clinique structurée en JSON. Sois factuel, sobre, professionnel.
N'invente rien. Si une information manque, laisse le champ vide.
RÈGLE ABSOLUE : ne jamais inclure de diagnostic médical.
```

**Output JSON :**
```json
{
  "motif": "Motif de consultation en 1-2 phrases",
  "contenu": "Résumé de la séance (3-5 paragraphes, style SOAP adapté psy)",
  "thematiques": ["tag1", "tag2"],
  "plan_therapeutique": "Prochaines étapes et orientations",
  "points_vigilance": "Points d'attention éventuels (vide si rien)",
  "disclaimer": "Note générée par IA — à réviser et valider par le praticien"
}
```

---

## Base de données

### Modifications `video_rooms`
```sql
ALTER TABLE video_rooms
  ADD COLUMN scribe_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN scribe_status    TEXT    NOT NULL DEFAULT 'none';
  -- scribe_status: none | processing | done | failed
```

### Modifications `sessions`
```sql
ALTER TABLE sessions
  ADD COLUMN scribe_transcript TEXT; -- chiffré AES-256-GCM, nullable
```

### Nouveau type consent `gdpr_consents`
Type : `ai_video_transcription`
Version : `2026-06-v1`
Portée : patient uniquement (le psy consent via l'activation du toggle + audit log)

### Migration Prisma
`20260604_ai_scribe`

---

## Nouveaux endpoints API

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/video/rooms/:appointmentId/scribe/enable` | Psy JWT | Active/désactive le scribe, enregistre le consentement psy |
| `POST` | `/video/rooms/:appointmentId/scribe/audio` | Psy JWT | Upload audio WebM (multipart, max 25MB) |
| `GET` | `/video/rooms/:appointmentId/scribe/status` | Psy JWT | Statut processing (polling côté client) |

Le consentement patient `ai_video_transcription` passe par le flow existant :
- `POST /video/consent/:token` avec body `{ type: 'ai_video_transcription' }` (ou étendu)

---

## Modifications frontend

### Nouveaux fichiers
- `apps/web/src/hooks/use-scribe-recorder.ts` — AudioContext + MediaRecorder + upload
- `apps/web/src/components/video/scribe-toggle.tsx` — Bouton toggle Pro-gated
- `apps/web/src/components/video/scribe-result-banner.tsx` — Bannière post-visio sur fiche session

### Fichiers modifiés
- `apps/web/src/components/video/video-room.tsx` — intégrer ScribeToggle + useScribeRecorder
- `apps/web/src/app/(patient-video)/patient-portal/video/[token]/page.tsx` — + case consentement `ai_video_transcription`
- `apps/web/src/app/(dashboard)/sessions/[id]/page.tsx` — + ScribeResultBanner si `summary_ai` présent

---

## Consentement & RGPD

| Acteur | Consentement requis | Quand |
|---|---|---|
| Patient | Case opt-in page rejoindre visio (`ai_video_transcription`) | Avant que le toggle soit actif |
| Psy | Activation du toggle = consentement implicite + audit log | Au moment de l'activation |

- Si patient n'a pas coché : toggle psy grisé, tooltip "Le patient n'a pas encore accepté la transcription IA"
- Le patient peut rejoindre la visio sans cocher (transcription désactivée pour cette séance)
- Consentement stocké dans `gdpr_consents` avec `version: '2026-06-v1'` et IP

---

## Plan gate

```typescript
// Vérification côté API (enable + upload)
@RequirePlan(SubscriptionPlan.PRO, SubscriptionPlan.CLINIC)
```

Côté frontend :
- Free/Solo : bouton visible mais désactivé avec badge "Pro" + tooltip
- Pro/Clinic : bouton actif

---

## Variables d'environnement requises

```env
OPENAI_API_KEY=sk-...   # Pour Whisper uniquement (transcription)
# OpenRouter déjà configuré pour la génération de note
```

---

## Sécurité & HDS

- Transcript chiffré AES-256-GCM en DB (même pattern que `sessions.notes`)
- Audio WebM : stockage temporaire uniquement en mémoire Node (pas de fichier disque) → transmis directement à Whisper
- Audit log sur `AI_SCRIBE_COMPLETE` + `AI_SCRIBE_FAILED`
- Données audio ne persistent pas : jamais stockées sur le VPS ni en DB
- Consentement double (psy + patient) avant tout traitement

---

## Hors scope (cette phase)

- Transcription en temps réel (LiveKit Agents Python)
- Sous-titres live pour accessibilité
- Résumé patient-friendly partagé via portail
- Scribe en séance présentielle (sans visio)
