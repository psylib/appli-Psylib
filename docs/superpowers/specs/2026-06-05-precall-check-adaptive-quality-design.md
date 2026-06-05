# Test pré-appel + Fallback audio adaptatif — Design

> **Date :** 2026-06-05
> **Statut :** Validé (design), prêt pour plan d'implémentation
> **Scope :** Frontend Next.js uniquement. Aucun changement backend, aucune migration DB. Déploiement Vercel.

## Objectif

Réduire les problèmes audio/vidéo en visio :

1. **Test pré-appel** (patient + invité) : avant de rejoindre, vérifier que le micro capte
   vraiment du son, que la caméra fonctionne, que le bon périphérique est sélectionné, que le
   haut-parleur marche, et estimer la bande passante.
2. **Fallback audio-only adaptatif** (psy + patient) : pendant la séance, si la connexion chute
   durablement, couper automatiquement la vidéo pour préserver l'audio, avec bandeau et bouton
   manuel pour réactiver.

## Principes directeurs

- **Jamais bloquant** : en contexte thérapeutique, on n'empêche jamais quelqu'un de rejoindre.
  On informe, on conseille, l'utilisateur décide.
- **Ne jamais surprendre** : le fallback ne touche pas une caméra coupée manuellement, et ne
  réactive jamais la vidéo de force — il la propose.
- **Isolation** : toute la logique vit dans des hooks dédiés, testables sans rendu vidéo réel.
- **HDS** : aucune donnée nouvelle persistée, aucune nouvelle PII.

---

## Section 1 — Test pré-appel (salle d'attente)

S'applique au patient ET à l'invité, via la `WaitingRoom` existante.

### Hook `use-precall-check.ts`

Encapsule toute la logique. API exposée :

| Champ / méthode | Type | Rôle |
|---|---|---|
| `audioLevel` | `number` (0-1) | Niveau RMS du micro via Web Audio API (`AnalyserNode`) → VU-mètre |
| `bandwidth` | `{ mbps: number; quality: 'good'\|'fair'\|'poor'; status: 'testing'\|'done'\|'error' }` | Résultat sonde de débit |
| `devices` | `{ mics: MediaDeviceInfo[]; cams: MediaDeviceInfo[]; speakers: MediaDeviceInfo[] }` | Périphériques disponibles (`enumerateDevices`) |
| `selected` | `{ micId?: string; camId?: string; speakerId?: string }` | Sélection courante |
| `setDevice(kind, id)` | `(kind, id) => void` | Change un périphérique, recrée le `MediaStream` |
| `stream` | `MediaStream \| null` | Stream courant (pour la preview) |
| `testSpeaker()` | `() => void` | Joue un son test court sur le haut-parleur sélectionné |
| `error` | `string \| null` | Erreur permission caméra/micro (non bloquant) |

### Mesure de bande passante (Option A — sonde de débit active)

1. `fetch('/bandwidth-probe.bin', { cache: 'no-store' })` sur un asset statique d'environ 800 KB
   dans `apps/web/public/`.
2. Mesure du temps de téléchargement → débit descendant en Mbps (`octets * 8 / 1e6 / secondes`).
3. Quand disponible, on lit `navigator.connection.downlink` comme indice complémentaire (on garde
   la valeur la plus défavorable des deux).
4. En cas d'échec réseau → `status: 'error'`, traité comme non concluant (jamais bloquant).

**Seuils** (alignés sur LiveKit VP9 720p) :

- `≥ 1.5 Mbps` → `good` 🟢 Bonne connexion
- `0.5 – 1.5 Mbps` → `fair` 🟠 Connexion correcte
- `< 0.5 Mbps` → `poor` 🔴 Connexion faible — l'audio sera privilégié

### Composant `precall-checklist.tsx`

Rendu dans `WaitingRoom`, sous la preview vidéo :

- **VU-mètre** sous l'icône micro : barre horizontale qui pulse selon `audioLevel`.
  Avertissement « Aucun son détecté — parlez pour tester » si `audioLevel` reste ≈ 0.
- **3 menus déroulants** (micro / caméra / haut-parleur) — affichés seulement si le `kind`
  correspondant a plus d'un périphérique.
- **Bouton 🔊 « Tester le son »** → `testSpeaker()`.
- **Badge bande passante** : icône + libellé couleur selon `bandwidth.quality` (skeleton pendant
  `testing`).
- Tous les avertissements sont informatifs. Le bouton « Rejoindre la consultation » reste
  **toujours actif** dès qu'un device audio OU vidéo est présent (comportement actuel conservé).

### Intégration `WaitingRoom`

- Signature conservée : `psychologistName`, `onReady`.
- Ajout d'un callback optionnel rétro-compatible `onDevicesSelected?(selected)` pour transmettre
  les périphériques choisis à `PatientVideoRoom`, afin que LiveKit démarre sur le bon micro/caméra.
- La logique `getUserMedia` actuelle de `WaitingRoom` est remplacée par le hook (source unique de
  vérité pour le stream).

---

## Section 2 — Fallback audio-only adaptatif (en séance)

S'applique au psy (`video-room.tsx`) ET au patient (`patient-video-room.tsx`).

### Hook `use-adaptive-quality.ts`

Écoute la qualité de connexion LiveKit du participant local et pilote la dégradation.

| Champ / méthode | Type | Rôle |
|---|---|---|
| `degraded` | `boolean` | Vrai si la vidéo est coupée par le fallback |
| `reason` | `'auto' \| 'manual' \| null` | Origine de la dégradation |
| `connectionPoor` | `boolean` | Qualité actuellement mauvaise (pour affichage temps réel) |
| `forceAudioOnly()` | `() => void` | Coupe la vidéo manuellement |
| `restoreVideo()` | `() => void` | Réactive la vidéo |

**Logique anti-flapping :**

- Écoute `RoomEvent.ConnectionQualityChanged` filtré sur le participant local.
- Dégradation auto déclenchée seulement si la qualité reste `ConnectionQuality.Poor` pendant
  **~6 s consécutives** → `localParticipant.setCameraEnabled(false)`, `reason = 'auto'`.
- Remontée : si la qualité revient à `Good` et reste stable **~8 s**, on propose la réactivation
  (bandeau), sans forcer.
- **Respect du choix manuel** : un flag `userDisabledCam` suit les coupures volontaires de caméra.
  Si l'utilisateur a coupé sa caméra lui-même, le hook ne la rallume jamais et ne compte pas ça
  comme une dégradation.

### Composant `connection-banner.tsx`

Bandeau réutilisable affiché en haut des deux salles :

- État dégradé (`auto`) : « Mode audio — connexion faible » + bouton « Réactiver la vidéo ».
- Connexion rétablie après dégradation auto : « Connexion rétablie — Réactiver la vidéo ? ».
- Discret, n'obstrue pas la vidéo.

### Intégration

- `patient-video-room.tsx` et `video-room.tsx` : montent le hook, rendent `connection-banner`,
  ajoutent un bouton manuel « Passer en audio seul » dans la barre de contrôles.
- Chaque participant gère sa propre vidéo localement (comportement WebRTC correct, pas de
  coordination cross-participant).

---

## Section 3 — Tests, fichiers & non-régression

### Tests (Vitest)

**`use-precall-check.test.ts`** — mocks `getUserMedia`, `enumerateDevices`, `fetch` :
- Calcul qualité bande passante respecte les seuils good/fair/poor.
- `setDevice` recrée le stream avec la bonne contrainte.
- `audioLevel` exposé et borné 0-1.
- `fetch` échoué → `status: 'error'`, non bloquant.

**`use-adaptive-quality.test.ts`** — mock `ConnectionQualityChanged` :
- Pas de coupure avant 6 s de `Poor` continu.
- Coupure auto après 6 s, `reason = 'auto'`.
- Caméra coupée manuellement → hook n'intervient pas (`userDisabledCam`).
- Réactivation proposée après remontée stable ; `restoreVideo()` rallume.
- Listeners nettoyés à l'unmount.

### File Map

```
apps/web/src/
  hooks/
    use-precall-check.ts            ← NEW
    use-adaptive-quality.ts         ← NEW
    __tests__/
      use-precall-check.test.ts     ← NEW
      use-adaptive-quality.test.ts  ← NEW
  components/video/
    precall-checklist.tsx           ← NEW  (VU-mètre + selects + badge bw + test son)
    connection-banner.tsx           ← NEW  (bandeau fallback réutilisable)
    waiting-room.tsx                ← MOD  intègre precall-checklist, hook source du stream
    patient-video-room.tsx          ← MOD  use-adaptive-quality + banner + bouton manuel
    video-room.tsx                  ← MOD  use-adaptive-quality + banner + bouton manuel
apps/web/public/
  bandwidth-probe.bin               ← NEW  asset ~800 KB pour la sonde de débit
```

### Non-régression

- `WaitingRoom` garde sa signature publique ; `onDevicesSelected` est optionnel.
- Aucun changement backend, aucune migration DB.
- Le fallback ne touche jamais une caméra coupée manuellement.
- HDS : aucune donnée nouvelle persistée.

### Déploiement

- Vercel uniquement : `npx vercel --prod --yes` depuis la racine.
- Pas de rebuild API VPS.
