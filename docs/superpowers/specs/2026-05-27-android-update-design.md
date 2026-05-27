# Design — Mise à jour Android PsyLib (mai 2026)

**Date :** 2026-05-27  
**Approche retenue :** B — Correctifs + 3 features clés en une passe, puis build EAS production  
**Scope :** `apps/mobile/` uniquement — aucun changement backend requis

---

## Contexte

L'app Android est en retard de ~2 mois (dernier build : mars 2026, versionCode 7 sur Play Store).
Le web a évolué significativement depuis : feature flags plans, visio instantanée, Smart Slot Picker,
settings cabinet enrichis, fixes disponibilités, conformité HDS/Sentry.

Les endpoints backend sont déjà tous disponibles — le travail est 100% frontend mobile.

---

## Périmètre

### 1. Feature flag comptabilité (Pro+ only)

**Problème :** Les écrans `app/accounting/` sont accessibles à tous les plans. Le web gate derrière Pro/Clinic.

**Solution :**
- Nouveau hook `usePlanFeatures()` dans `hooks/usePlanFeatures.ts`
  - Lit le `plan` depuis le store auth (`useAuth`)
  - Expose `{ canAccessAccounting, canAccessAI, canAccessVideo, ... }`
- `app/(tabs)/more.tsx` — entrée Comptabilité grisée + badge "Pro" si Free/Solo
- `app/accounting/index.tsx` — écran FeatureLock si accès direct (deep link)
- Même pattern applicable aux autres features gatées (AI, visio instantanée)

**Endpoints :** aucun nouveau — plan lu depuis le JWT existant.

---

### 2. Visio native LiveKit

**Problème :** La visio actuelle ouvre un browser externe (`Linking.openURL`). UX dégradée, sortie de l'app.

**Solution :**

**Dépendances à ajouter :**
```
@livekit/react-native
livekit-client
```

**Permissions `AndroidManifest.xml` :**
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
```

**Nouveau fichier `app/video-room.tsx` :**
- Reçoit `roomName` + `token` en params de navigation
- `LiveKitRoom` connecté au serveur LiveKit OVH HDS (`wss://livekit.psylib.eu`)
- Grille participants : `VideoTrack` par participant actif
- Barre de contrôles fixe en bas : mute micro, couper caméra, raccrocher
- Déconnexion propre sur raccrocher ou retour arrière

**Nouveau hook `useRoomToken(appointmentId)` dans `hooks/useVideoRooms.ts` :**
- `POST /api/v1/video/token` — token pour rejoindre un room existant

**Nouveau hook `useInstantVideo()` :**
- `POST /api/v1/video/instant` → `{ roomName, token }`
- Gated Solo+ via `usePlanFeatures()`

**Modifications `app/video.tsx` :**
- Bouton "Visio instantanée" en haut (Solo+) → bottom sheet `InstantVideoSheet`
  - Sélecteur patient optionnel
  - Bouton "Lancer" → appel `useInstantVideo()` → navigate vers `video-room`
- Bouton "Rejoindre" sur chaque room du jour → `useRoomToken()` → navigate vers `video-room`

**Nouveau composant `components/InstantVideoSheet.tsx` :**
- Modal React Native (bottom sheet)
- Picker patient optionnel
- CTA "Lancer la visio"

**Conformité HDS :** le serveur LiveKit est self-hosted OVH HDS. Aucune donnée ne transite hors HDS.

---

### 3. Smart Slot Picker simplifié

**Problème :** `app/(tabs)/sessions/new.tsx` crée une `Session` directement via `POST /sessions`.
Le web crée un `Appointment` basé sur les disponibilités configurées.

**Solution :**

**Refonte de `app/(tabs)/sessions/new.tsx` en flow 2 étapes :**

**Étape 1 — Créneau :**
- Sélecteur patient (même picker qu'actuellement)
- `DateTimePicker` natif Expo pour sélectionner la date
- Sous la date : pills horaires disponibles chargées via `GET /api/v1/availability/timeslots?date=YYYY-MM-DD`
- Si aucun créneau disponible : message "Aucun créneau ce jour" + lien vers settings disponibilités

**Étape 2 — Détails :**
- Type : individuel / groupe / en ligne (pills existantes)
- Durée (input numérique)
- Tarif (input numérique, optionnel)
- Modalité : cabinet / visio (pills)
- Notes (textarea, optionnel)

**Résultat :** crée un `Appointment` via `POST /api/v1/appointments` (non plus `/sessions`).

**Nouveau hook `useAvailableTimeslots(date: string)` dans `hooks/useAppointments.ts` :**
- `GET /api/v1/availability/timeslots?date=YYYY-MM-DD`
- Retourne `string[]` de créneaux au format `HH:MM`

**Impact liste séances :** inchangée (`GET /sessions`). Les appointments créés apparaissent dans le calendrier existant.

---

### 4. Settings cabinet enrichis

**Problème :** `app/settings/` n'a que `profile.tsx`. Les settings cabinet (modalité, message confirmation, Google Calendar) introduits sur le web en mai sont absents.

**Solution :**

**Nouveau fichier `app/settings/practice.tsx` :**
- **Section Modalité par défaut** — pills "Au cabinet" / "En visio" / "Les deux"
  - Sauvegardé via `PUT /api/v1/psychologists/me` → champ `default_modality`
- **Section Message de confirmation** — textarea libre
  - Sauvegardé via `PUT /api/v1/psychologists/me` → champ `booking_confirmation_message`
- **Section Google Calendar** — statut connexion + bouton Connecter/Déconnecter
  - Connexion : `Linking.openURL` vers `https://api.psylib.eu/api/v1/calendar/connect/google`
  - Statut lu depuis `GET /api/v1/calendar/status`

**Modification `app/settings/index.tsx` :**
- Nouvelle entrée "Cabinet" dans le menu → navigate vers `settings/practice`

**Hook `usePracticeSettings()` dans `hooks/usePracticeSettings.ts` :**
- `GET /api/v1/psychologists/me` (déjà partiellement en place)
- `PUT /api/v1/psychologists/me` pour les mises à jour

---

## Ordre d'implémentation

1. `usePlanFeatures()` + feature flag comptabilité — fondation pour la suite
2. LiveKit natif (`video-room.tsx` + hooks) — le plus complexe, fait en premier
3. Smart Slot Picker simplifié (`sessions/new.tsx`) — refonte écran existant
4. Settings cabinet (`practice.tsx`) — ajout pur
5. Build EAS production (`eas build --platform android --profile production`)
6. Submit Play Store (`eas submit --platform android`)

---

## Fichiers créés / modifiés

| Fichier | Action |
|---|---|
| `hooks/usePlanFeatures.ts` | Nouveau |
| `hooks/usePracticeSettings.ts` | Nouveau |
| `app/video-room.tsx` | Nouveau |
| `components/InstantVideoSheet.tsx` | Nouveau |
| `app/(tabs)/sessions/new.tsx` | Refonte |
| `app/video.tsx` | Modifié |
| `app/(tabs)/more.tsx` | Modifié |
| `app/accounting/index.tsx` | Modifié |
| `app/settings/index.tsx` | Modifié |
| `app/settings/practice.tsx` | Nouveau |
| `hooks/useVideoRooms.ts` | Modifié (nouveaux hooks) |
| `hooks/useAppointments.ts` | Modifié (useAvailableTimeslots) |
| `AndroidManifest.xml` | Modifié (permissions) |
| `package.json` | Modifié (@livekit/react-native) |

---

## Hors périmètre

- Minor patients / guardians (complexité élevée, peu d'usage immédiat)
- Document sharing (pas de viewer PDF natif en place)
- iOS build (placeholders Apple non configurés dans eas.json)
- LiveKit background service (appels en arrière-plan — v2)
