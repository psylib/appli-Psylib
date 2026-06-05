# Présentation de documents en direct (visio) — Design

> **Date :** 2026-06-05
> **Statut :** Validé (design), prêt pour plan d'implémentation
> **Scope :** Frontend Next.js + 1 endpoint backend authentifié. Aucune migration DB.

## Objectif

Permettre au psychologue de présenter, en un clic pendant la visio, un document déjà
partagé avec le patient (table `shared_documents`). Le document s'affiche automatiquement
et de façon synchronisée chez tous les participants (patient 1-à-1, multi-participant, invités),
pour le regarder ensemble (exercices, schémas TCC, comptes-rendus).

## Décisions validées

- **Pilotage** : le psy seul présente. Synchro automatique chez les participants.
- **Types** : PDF, JPEG, PNG (affichables nativement). DOCX/ODT grisés (« non prévisualisable »).
- **Portée** : documents déjà partagés avec CE patient. Salles patient 1-à-1 + multi-participant ;
  les invités voient ce que le psy présente.
- **Transport** : P2P via LiveKit DataChannel (Approche A) — aucune persistance, transit chiffré,
  atteint tous les participants sans authentification par participant. Plafond ~5 Mo.

## Principes directeurs

- **HDS** : rien de persisté côté présentation ; transit chiffré LiveKit ; `objectURL` révoqué
  à la fermeture ; aucun lien direct S3 exposé.
- **Isolation** : transport encapsulé dans un hook dédié ; découpage isolé dans un module pur ;
  rendu dans un composant dédié.
- **Coexistence** : le hook de présentation partage `RoomEvent.DataReceived` avec le chat existant ;
  chacun valide son propre format et ignore l'autre.

---

## Section 1 — Backend (changement minimal)

**Un seul ajout** : `GET /documents/:id/download` (psy authentifié).

- Contrôleur `apps/api/src/documents/documents.controller.ts` : nouvelle route
  `@Get(':id/download')`, gardes existantes (`KeycloakGuard`, `RolesGuard`, `@Roles('psychologist')`),
  `ParseUUIDPipe` sur `:id`.
- Service `apps/api/src/documents/documents.service.ts` : méthode `downloadForPsy(psyId, id)` qui :
  - vérifie que le document existe, appartient à `psyId`, n'est pas soft-deleted (sinon 404) ;
  - lit les octets depuis OVH S3 (ou fallback local) — réutilise la logique de lecture déjà
    utilisée par le download patient ;
  - écrit un audit log `READ` ;
  - renvoie un stream de fichier (mime-type correct, `Content-Disposition: inline`).

Aucune migration, aucune nouvelle table. Le patient/invité ne contacte jamais le backend pour
cette feature.

---

## Section 2 — Frontend

### Module pur `lib/video/chunk.ts`

- `bytesToChunks(bytes: Uint8Array, chunkSize: number): string[]` — encode en base64 et découpe.
- `chunksToBlob(chunks: string[], mimeType: string): Blob` — réassemble.
- Testable sans DOM/LiveKit.

### Hook `use-doc-presentation.ts` (partagé psy + patient)

Construit sur le DataChannel LiveKit (même mécanisme que `use-video-chat`). Messages JSON avec un
champ discriminant `kind` (`'doc-start' | 'doc-chunk' | 'doc-close'`) pour cohabiter avec le chat.

API exposée :

| Champ / méthode | Type | Rôle |
|---|---|---|
| `presented` | `{ fileName: string; mimeType: string; url: string } \| null` | Document actuellement affiché |
| `progress` | `{ received: number; total: number } \| null` | Avancement de la réception |
| `presentDocument` | `(meta: { fileName: string; mimeType: string }, bytes: Uint8Array) => void` | (Psy) diffuse un document |
| `closeDocument` | `() => void` | (Psy) ferme la présentation |

Comportement :
- **Émetteur** : envoie `doc-start` (`{ kind, docId, fileName, mimeType, totalChunks }`), puis les
  chunks `doc-chunk` (`{ kind, docId, i, data }`) en `reliable`. `closeDocument()` → `doc-close`.
- **Récepteur** : sur `doc-start` initialise un buffer ; accumule les `doc-chunk` (indexés) ; à
  réception complète construit un `Blob` + `URL.createObjectURL` et peuple `presented`. `doc-close`
  → révoque l'`objectURL` et remet `presented`/`progress` à `null`. Paquets malformés / `kind`
  inconnu → ignorés silencieusement.
- Révoque l'`objectURL` au changement de document et à l'unmount.

### Client API `lib/api/documents.ts`

- `downloadDocument(id: string): Promise<{ bytes: Uint8Array; mimeType: string; fileName: string }>`
  — appelle `GET /documents/:id/download` (psy authentifié), renvoie les octets.

### Composant `doc-presentation-panel.tsx` (partagé)

- Rend `presented` : `<img>` pour JPEG/PNG, `<iframe>`/`<embed>` pour PDF.
- Header : nom du fichier ; bouton fermer visible côté psy uniquement (prop `canClose`).
- Loader avec `progress` pendant la réception.
- Affiché en overlay sur la zone vidéo (façon partage d'écran), caméras en filmstrip.

### Composant `present-document-picker.tsx` (psy uniquement)

- Bouton 📄 dans la barre de contrôles (à côté du chat), ouvre un popover.
- Liste les `shared_documents` de CE patient via `GET /documents?patientId=…`.
- Filtre : PDF/JPEG/PNG présentables ; DOCX/ODT grisés (« non prévisualisable ») ;
  fichiers > 5 Mo grisés (« trop volumineux — à consulter via le portail »).
- Au clic : `downloadDocument(id)` → `presentDocument({ fileName, mimeType }, bytes)`.

### Intégration

- `video-room.tsx` (psy) : monte `use-doc-presentation`, rend le picker (slot dans
  `VideoControls`) et le `doc-presentation-panel` (`canClose`). Nécessite le `patientId` du RDV
  (déjà disponible dans la page `/video/[roomId]`).
- `patient-video-room.tsx` : monte `use-doc-presentation`, rend le `doc-presentation-panel`
  (réception, pas de fermeture).

---

## Section 3 — Tests, fichiers & non-régression

### Tests (Vitest)

**`lib/video/__tests__/chunk.test.ts`** :
- `bytesToChunks` découpe en respectant `chunkSize`, base64 valide.
- `chunksToBlob(bytesToChunks(x))` round-trip → Blob de bonne taille/type.

**`hooks/__tests__/use-doc-presentation.test.ts`** (mock `useRoomContext`) :
- `presentDocument` publie `doc-start` puis les chunks (`publishData` appelé `totalChunks + 1` fois).
- Réception ordonnée des chunks → `presented` peuplé (`fileName`/`mimeType`).
- `doc-close` reçu → `presented` repasse à `null`.
- Paquet malformé / `kind` inconnu → ignoré, `presented` inchangé.
- Listener nettoyé à l'unmount.

### File Map

```
apps/api/src/documents/
  documents.controller.ts          ← MOD  + GET /documents/:id/download
  documents.service.ts             ← MOD  + downloadForPsy(psyId, id)
apps/web/src/
  lib/video/
    chunk.ts                       ← NEW
    __tests__/chunk.test.ts        ← NEW
  hooks/
    use-doc-presentation.ts        ← NEW
    __tests__/use-doc-presentation.test.ts ← NEW
  lib/api/documents.ts             ← MOD  + downloadDocument(id)
  components/video/
    doc-presentation-panel.tsx     ← NEW
    present-document-picker.tsx     ← NEW
    video-room.tsx                 ← MOD  picker + panneau (psy)
    patient-video-room.tsx         ← MOD  panneau (réception)
```

### Non-régression

- Hooks chat et présentation coexistent sur `RoomEvent.DataReceived` : discrimination par format
  (chat exige un `sender` valide ; présentation exige un `kind` `doc-*`).
- Plafond 5 Mo appliqué côté picker.
- HDS : rien de persisté, transit chiffré, `objectURL` révoqué à la fermeture.
- Backend : 1 endpoint authentifié, aucune migration.

### Déploiement

- **Vercel** (frontend) : `npx vercel --prod --yes` depuis la racine.
- **VPS** (API) : rebuild image `psyscale-api:latest` + redéploiement (procédure manuelle habituelle),
  pour le nouvel endpoint `GET /documents/:id/download`.
