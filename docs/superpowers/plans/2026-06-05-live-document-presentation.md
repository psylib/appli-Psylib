# Présentation de documents en direct (visio) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre au psy de présenter en un clic un document déjà partagé (PDF/image) pendant la visio, affiché et synchronisé chez tous les participants via le DataChannel LiveKit.

**Architecture:** Le psy télécharge les octets de son document via un nouvel endpoint authentifié, les découpe (module pur `chunk.ts`) et les diffuse en P2P via un hook `use-doc-presentation` (DataChannel LiveKit, topic `doc-*`, coexiste avec le chat). Un composant partagé `doc-presentation-panel` affiche le document chez tous. Un picker côté psy liste les documents présentables du patient.

**Tech Stack:** NestJS (StreamableFile), LiveKit components-react v2, Vitest, Tailwind, lucide-react.

---

## File Map

```
apps/api/src/video/dto/video.dto.ts          ← MOD  + patientId dans VideoTokenResponse
apps/api/src/video/video.service.ts          ← MOD  + patientId dans generatePsyToken
apps/api/src/documents/documents.controller.ts ← MOD  + GET /documents/:id/download
apps/api/src/documents/documents.service.ts    ← MOD  + downloadForPsy()
apps/web/src/lib/api/video.ts                ← MOD  + patientId dans VideoTokenResponse
apps/web/src/lib/api/documents.ts            ← NEW  listDocuments + downloadDocumentBytes
apps/web/src/lib/video/chunk.ts              ← NEW  bytesToChunks / chunksToBlob (pur)
apps/web/src/lib/video/__tests__/chunk.test.ts ← NEW
apps/web/src/hooks/use-doc-presentation.ts   ← NEW  DataChannel présentation
apps/web/src/hooks/__tests__/use-doc-presentation.test.ts ← NEW
apps/web/src/components/video/doc-presentation-panel.tsx ← NEW
apps/web/src/components/video/present-document-picker.tsx ← NEW
apps/web/src/components/video/video-room.tsx ← MOD  picker + panneau (psy)
apps/web/src/components/video/patient-video-room.tsx ← MOD  panneau (réception)
apps/web/src/app/(dashboard)/video/[roomId]/page.tsx ← MOD  passe patientId
```

---

## Task 1: Backend — endpoint de téléchargement psy

**Files:**
- Modify: `apps/api/src/documents/documents.service.ts`
- Modify: `apps/api/src/documents/documents.controller.ts`

- [ ] **Step 1: Ajouter `downloadForPsy` au service**

In `apps/api/src/documents/documents.service.ts`, add this method right before the `private safeDecrypt(` method (near the end of the class):

```ts
  async downloadForPsy(userId: string, docId: string, req?: Request) {
    const psy = await this.prisma.psychologist.findUnique({ where: { userId } });
    if (!psy) throw new NotFoundException('Psychologue introuvable');

    const doc = await this.prisma.sharedDocument.findFirst({
      where: { id: docId, psychologistId: psy.id, deletedAt: null },
    });
    if (!doc) throw new NotFoundException('Document introuvable');

    const buffer = await this.storage.download(doc.filePath);

    await this.audit.log({
      actorId: userId,
      actorType: 'psychologist',
      action: 'READ',
      entityType: 'document',
      entityId: docId,
      req,
    });

    return { buffer, fileName: doc.fileName, mimeType: doc.mimeType };
  }
```

(`this.storage` is the injected `StorageService` — confirm it is already a constructor dependency in this service; it is used by `softDelete` via `this.storage.delete`, so it exists.)

- [ ] **Step 2: Ajouter la route au contrôleur**

In `apps/api/src/documents/documents.controller.ts`:

Add to the imports from `@nestjs/common` (if missing): `Res`. Add at top: `import { Response } from 'express';` (note: `Request` is already imported as a type). Add `import { Readable } from 'stream';` and `import { StreamableFile } from '@nestjs/common';` (StreamableFile is in `@nestjs/common`).

Add this route method inside the controller class, after the existing `@Get(':id')` handler:

```ts
  @Get(':id/download')
  @ApiOperation({ summary: 'Télécharger les octets d’un document (psy)' })
  async download(
    @CurrentUser() user: KeycloakUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const { buffer, fileName, mimeType } = await this.documentsService.downloadForPsy(
      user.sub,
      id,
      req,
    );
    const safeFileName = fileName.replace(/[\r\n\x00-\x1F"\\]/g, '').slice(0, 255);
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(safeFileName)}"`,
    });
    return new StreamableFile(Readable.from(buffer));
  }
```

- [ ] **Step 3: Vérifier la compilation API**

Run: `pnpm --filter api exec tsc --noEmit 2>&1 | grep -E "documents.controller|documents.service"`
Expected: aucune sortie.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/documents/documents.controller.ts apps/api/src/documents/documents.service.ts
git commit -m "feat(documents): add authenticated psy download endpoint"
```

---

## Task 2: Backend — exposer patientId dans le token psy

**Files:**
- Modify: `apps/api/src/video/dto/video.dto.ts`
- Modify: `apps/api/src/video/video.service.ts`

- [ ] **Step 1: Ajouter le champ au DTO**

In `apps/api/src/video/dto/video.dto.ts`, inside the `VideoTokenResponse` interface, add:

```ts
  patientId?: string | null;
```

- [ ] **Step 2: Renvoyer patientId depuis generatePsyToken**

In `apps/api/src/video/video.service.ts`, in the `return { ... }` block of `generatePsyToken` (around line 287), add the field:

```ts
      patientId: room.appointment.patientId,
```

- [ ] **Step 3: Vérifier la compilation API**

Run: `pnpm --filter api exec tsc --noEmit 2>&1 | grep -E "video.service|video.dto"`
Expected: aucune sortie.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/video/dto/video.dto.ts apps/api/src/video/video.service.ts
git commit -m "feat(video): expose patientId in psy token response"
```

---

## Task 3: Module pur de découpage

**Files:**
- Create: `apps/web/src/lib/video/chunk.ts`
- Test: `apps/web/src/lib/video/__tests__/chunk.test.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/lib/video/__tests__/chunk.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { bytesToChunks, chunksToBlob } from '../chunk';

describe('chunk', () => {
  it('splits bytes into chunks of the given size', () => {
    const bytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7]);
    const chunks = bytesToChunks(bytes, 3);
    // base64 of 3 raw bytes = 4 chars; 7 bytes => ceil(7/3) = 3 chunks
    expect(chunks).toHaveLength(3);
    expect(chunks.every((c) => typeof c === 'string' && c.length > 0)).toBe(true);
  });

  it('round-trips bytes through chunks back to a Blob of the same size', async () => {
    const bytes = new Uint8Array(1000).map((_, i) => i % 256);
    const chunks = bytesToChunks(bytes, 256);
    const blob = chunksToBlob(chunks, 'application/pdf');
    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBe(1000);
    const roundTripped = new Uint8Array(await blob.arrayBuffer());
    expect(Array.from(roundTripped)).toEqual(Array.from(bytes));
  });

  it('handles empty input', () => {
    expect(bytesToChunks(new Uint8Array([]), 256)).toEqual([]);
    expect(chunksToBlob([], 'image/png').size).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm vitest run src/lib/video/__tests__/chunk.test.ts`
Expected: FAIL — module `../chunk` introuvable.

- [ ] **Step 3: Write the implementation**

Create `apps/web/src/lib/video/chunk.ts`:

```ts
/**
 * Découpage/réassemblage d'octets pour le transfert P2P via LiveKit DataChannel.
 * Les octets sont encodés en base64 (transport JSON texte) et découpés en
 * morceaux d'octets bruts (la taille s'applique AUX OCTETS, pas au base64).
 */

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

export function bytesToChunks(bytes: Uint8Array, chunkSize: number): string[] {
  const chunks: string[] = [];
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    chunks.push(bytesToBase64(bytes.subarray(offset, offset + chunkSize)));
  }
  return chunks;
}

export function chunksToBlob(chunks: string[], mimeType: string): Blob {
  const parts = chunks.map((c) => base64ToBytes(c));
  return new Blob(parts as BlobPart[], { type: mimeType });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && pnpm vitest run src/lib/video/__tests__/chunk.test.ts`
Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/video/chunk.ts apps/web/src/lib/video/__tests__/chunk.test.ts
git commit -m "feat(video): add pure chunk/reassemble module for P2P transfer"
```

---

## Task 4: Client API documents (frontend)

**Files:**
- Create: `apps/web/src/lib/api/documents.ts`
- Modify: `apps/web/src/lib/api/video.ts`

- [ ] **Step 1: Ajouter patientId au type frontend**

In `apps/web/src/lib/api/video.ts`, inside the `VideoTokenResponse` interface (around line 24), add:

```ts
  patientId?: string | null;
```

- [ ] **Step 2: Créer le client documents**

Create `apps/web/src/lib/api/documents.ts`:

```ts
import { apiClient } from './client';

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

export interface SharedDocumentSummary {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  category: string;
  createdAt: string;
}

/** Liste les documents partagés avec un patient (psy authentifié). */
export async function listDocuments(patientId: string, token: string): Promise<SharedDocumentSummary[]> {
  // GET /documents est paginé : renvoie { data, total }.
  const body = await apiClient.get<{ data: SharedDocumentSummary[]; total: number }>(
    `/documents?patientId=${encodeURIComponent(patientId)}`,
    token,
  );
  return body.data ?? [];
}

/** Télécharge les octets d'un document (psy authentifié). */
export async function downloadDocumentBytes(
  id: string,
  token: string,
): Promise<{ bytes: Uint8Array; mimeType: string }> {
  const res = await fetch(`${API_BASE}/api/v1/documents/${id}/download`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Téléchargement échoué (${res.status})`);
  const mimeType = res.headers.get('Content-Type') ?? 'application/octet-stream';
  const buf = await res.arrayBuffer();
  return { bytes: new Uint8Array(buf), mimeType };
}
```

(Confirmé : `GET /documents` est paginé et renvoie `{ data: SharedDocumentSummary[]; total: number }` — `listDocuments` déballe `.data`.)

- [ ] **Step 3: Vérifier TypeScript**

Run: `cd apps/web && pnpm tsc --noEmit 2>&1 | grep -E "api/documents|api/video"`
Expected: aucune sortie.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/api/documents.ts apps/web/src/lib/api/video.ts
git commit -m "feat(documents): add frontend documents API client + patientId type"
```

---

## Task 5: Hook `use-doc-presentation`

**Files:**
- Create: `apps/web/src/hooks/use-doc-presentation.ts`
- Test: `apps/web/src/hooks/__tests__/use-doc-presentation.test.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/hooks/__tests__/use-doc-presentation.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { RoomEvent } from 'livekit-client';

const mockPublishData = vi.fn().mockResolvedValue(undefined);
const handlers: Record<string, (...args: unknown[]) => void> = {};
const mockRoom = {
  localParticipant: { publishData: mockPublishData },
  on: vi.fn((evt: string, cb: (...args: unknown[]) => void) => { handlers[evt] = cb; }),
  off: vi.fn(),
};
vi.mock('@livekit/components-react', () => ({
  useRoomContext: () => mockRoom,
}));

import { useDocPresentation } from '../use-doc-presentation';

const encoder = new TextEncoder();
function receive(obj: unknown) {
  act(() => { handlers[RoomEvent.DataReceived]?.(encoder.encode(JSON.stringify(obj))); });
}

describe('useDocPresentation', () => {
  beforeEach(() => { vi.clearAllMocks(); for (const k of Object.keys(handlers)) delete handlers[k]; });

  it('starts with no presented document', () => {
    const { result } = renderHook(() => useDocPresentation());
    expect(result.current.presented).toBeNull();
  });

  it('presentDocument publishes a start message then one message per chunk', () => {
    const { result } = renderHook(() => useDocPresentation());
    const bytes = new Uint8Array(700).fill(65); // 700 bytes
    act(() => { result.current.presentDocument({ fileName: 'a.pdf', mimeType: 'application/pdf' }, bytes); });
    // start + ceil(700/CHUNK) messages; just assert start was sent and >1 total
    expect(mockPublishData.mock.calls.length).toBeGreaterThan(1);
  });

  it('reassembles received chunks into a presented document', () => {
    const { result } = renderHook(() => useDocPresentation());
    // base64 of bytes [66] = "Qg=="
    receive({ kind: 'doc-start', docId: 'd1', fileName: 'x.png', mimeType: 'image/png', totalChunks: 1 });
    receive({ kind: 'doc-chunk', docId: 'd1', i: 0, data: 'Qg==' });
    expect(result.current.presented).not.toBeNull();
    expect(result.current.presented?.fileName).toBe('x.png');
    expect(result.current.presented?.mimeType).toBe('image/png');
  });

  it('doc-close clears the presented document', () => {
    const { result } = renderHook(() => useDocPresentation());
    receive({ kind: 'doc-start', docId: 'd1', fileName: 'x.png', mimeType: 'image/png', totalChunks: 1 });
    receive({ kind: 'doc-chunk', docId: 'd1', i: 0, data: 'Qg==' });
    receive({ kind: 'doc-close', docId: 'd1' });
    expect(result.current.presented).toBeNull();
  });

  it('ignores malformed packets and foreign kinds (e.g. chat)', () => {
    const { result } = renderHook(() => useDocPresentation());
    receive({ sender: 'patient', text: 'hi', id: '1', senderName: 'A', timestamp: 1 }); // chat msg
    receive('not json');
    expect(result.current.presented).toBeNull();
  });

  it('cleans up the listener on unmount', () => {
    const { unmount } = renderHook(() => useDocPresentation());
    expect(mockRoom.on).toHaveBeenCalledWith(RoomEvent.DataReceived, expect.any(Function));
    unmount();
    expect(mockRoom.off).toHaveBeenCalledWith(RoomEvent.DataReceived, expect.any(Function));
  });
});
```

Note: `receive('not json')` passes a string; the handler must `decoder.decode` a Uint8Array. Wrap the string in the encoder too — fix the test helper by encoding: in the malformed case use `act(() => handlers[RoomEvent.DataReceived]?.(encoder.encode('not json')))`. Update the test's fifth case to call `receive` only with objects and add a separate line `act(() => { handlers[RoomEvent.DataReceived]?.(encoder.encode('not json')); });` for the non-JSON case.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm vitest run src/hooks/__tests__/use-doc-presentation.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Write the implementation**

Create `apps/web/src/hooks/use-doc-presentation.ts`:

```ts
'use client';

import { useRoomContext } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { bytesToChunks, chunksToBlob } from '@/lib/video/chunk';

const CHUNK_SIZE = 12_000; // octets bruts par paquet (sous la limite ~15KiB du DataChannel)

export interface PresentedDoc {
  fileName: string;
  mimeType: string;
  url: string;
}

export interface UseDocPresentationReturn {
  presented: PresentedDoc | null;
  progress: { received: number; total: number } | null;
  presentDocument: (meta: { fileName: string; mimeType: string }, bytes: Uint8Array) => void;
  closeDocument: () => void;
}

interface Incoming {
  docId: string;
  fileName: string;
  mimeType: string;
  totalChunks: number;
  chunks: string[];
  received: number;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function useDocPresentation(): UseDocPresentationReturn {
  const room = useRoomContext();
  const [presented, setPresented] = useState<PresentedDoc | null>(null);
  const [progress, setProgress] = useState<{ received: number; total: number } | null>(null);
  const incomingRef = useRef<Incoming | null>(null);
  const urlRef = useRef<string | null>(null);

  const revokeUrl = useCallback(() => {
    if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = null; }
  }, []);

  useEffect(() => {
    const handleData = (payload: Uint8Array) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(decoder.decode(payload)) as Record<string, unknown>;
      } catch {
        return;
      }
      const kind = msg['kind'];
      if (kind === 'doc-start') {
        if (
          typeof msg['docId'] !== 'string' ||
          typeof msg['fileName'] !== 'string' ||
          typeof msg['mimeType'] !== 'string' ||
          typeof msg['totalChunks'] !== 'number'
        ) return;
        incomingRef.current = {
          docId: msg['docId'],
          fileName: msg['fileName'],
          mimeType: msg['mimeType'],
          totalChunks: msg['totalChunks'],
          chunks: new Array(msg['totalChunks']),
          received: 0,
        };
        setProgress({ received: 0, total: msg['totalChunks'] });
      } else if (kind === 'doc-chunk') {
        const inc = incomingRef.current;
        if (!inc || msg['docId'] !== inc.docId) return;
        if (typeof msg['i'] !== 'number' || typeof msg['data'] !== 'string') return;
        if (inc.chunks[msg['i']] === undefined) inc.received += 1;
        inc.chunks[msg['i']] = msg['data'];
        setProgress({ received: inc.received, total: inc.totalChunks });
        if (inc.received === inc.totalChunks) {
          const blob = chunksToBlob(inc.chunks, inc.mimeType);
          revokeUrl();
          const url = URL.createObjectURL(blob);
          urlRef.current = url;
          setPresented({ fileName: inc.fileName, mimeType: inc.mimeType, url });
          setProgress(null);
          incomingRef.current = null;
        }
      } else if (kind === 'doc-close') {
        incomingRef.current = null;
        revokeUrl();
        setPresented(null);
        setProgress(null);
      }
    };
    room.on(RoomEvent.DataReceived, handleData);
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
      revokeUrl();
    };
  }, [room, revokeUrl]);

  const publish = useCallback((obj: unknown) => {
    room.localParticipant
      .publishData(encoder.encode(JSON.stringify(obj)), { reliable: true })
      .catch((err: unknown) => console.error('[doc-presentation] publishData failed', err));
  }, [room]);

  const presentDocument = useCallback(
    (meta: { fileName: string; mimeType: string }, bytes: Uint8Array) => {
      const chunks = bytesToChunks(bytes, CHUNK_SIZE);
      const docId = crypto.randomUUID();
      publish({ kind: 'doc-start', docId, fileName: meta.fileName, mimeType: meta.mimeType, totalChunks: chunks.length });
      chunks.forEach((data, i) => publish({ kind: 'doc-chunk', docId, i, data }));
      // Affiche aussi côté psy localement (sans repasser par le réseau).
      revokeUrl();
      const url = URL.createObjectURL(chunksToBlob(chunks, meta.mimeType));
      urlRef.current = url;
      setPresented({ fileName: meta.fileName, mimeType: meta.mimeType, url });
    },
    [publish, revokeUrl],
  );

  const closeDocument = useCallback(() => {
    publish({ kind: 'doc-close' });
    revokeUrl();
    setPresented(null);
    setProgress(null);
  }, [publish, revokeUrl]);

  return { presented, progress, presentDocument, closeDocument };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && pnpm vitest run src/hooks/__tests__/use-doc-presentation.test.ts`
Expected: PASS — 6 tests. If the "publishes a start message then one message per chunk" test needs the JSDOM `crypto.randomUUID`, it is available in the vitest jsdom environment (already used by use-video-chat). Do NOT change assertions; fix implementation only if a real bug surfaces.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/hooks/use-doc-presentation.ts apps/web/src/hooks/__tests__/use-doc-presentation.test.ts
git commit -m "feat(video): add useDocPresentation hook — P2P document broadcast"
```

---

## Task 6: Composant `doc-presentation-panel`

**Files:**
- Create: `apps/web/src/components/video/doc-presentation-panel.tsx`

- [ ] **Step 1: Implémenter le composant**

Create `apps/web/src/components/video/doc-presentation-panel.tsx`:

```tsx
'use client';

import { X } from 'lucide-react';
import type { PresentedDoc } from '@/hooks/use-doc-presentation';

interface Props {
  presented: PresentedDoc | null;
  progress: { received: number; total: number } | null;
  canClose: boolean;
  onClose?: () => void;
}

export function DocPresentationPanel({ presented, progress, canClose, onClose }: Props) {
  if (!presented && !progress) return null;

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-gray-950/95">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-white">
        <span className="truncate text-sm font-medium">
          {presented?.fileName ?? 'Réception du document…'}
        </span>
        {canClose && presented && (
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-white/80 hover:bg-white/10"
            title="Fermer le document"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="flex flex-1 items-center justify-center overflow-hidden p-2">
        {!presented && progress ? (
          <div className="text-center text-white/70">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <p className="text-sm">
              Réception… {Math.round((progress.received / Math.max(progress.total, 1)) * 100)}%
            </p>
          </div>
        ) : presented?.mimeType.startsWith('image/') ? (
          <img src={presented.url} alt={presented.fileName} className="max-h-full max-w-full object-contain" />
        ) : (
          <iframe src={presented!.url} title={presented!.fileName} className="h-full w-full rounded bg-white" />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Vérifier TypeScript**

Run: `cd apps/web && pnpm tsc --noEmit 2>&1 | grep doc-presentation-panel`
Expected: aucune sortie.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/video/doc-presentation-panel.tsx
git commit -m "feat(video): add DocPresentationPanel component"
```

---

## Task 7: Composant `present-document-picker`

**Files:**
- Create: `apps/web/src/components/video/present-document-picker.tsx`

- [ ] **Step 1: Implémenter le composant**

Create `apps/web/src/components/video/present-document-picker.tsx`:

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { listDocuments, downloadDocumentBytes, type SharedDocumentSummary } from '@/lib/api/documents';

const MAX_PRESENT_BYTES = 5 * 1024 * 1024; // 5 Mo
const PRESENTABLE = ['application/pdf', 'image/jpeg', 'image/png'];

interface Props {
  patientId: string;
  accessToken: string;
  onPresent: (meta: { fileName: string; mimeType: string }, bytes: Uint8Array) => void;
}

export function PresentDocumentPicker({ patientId, accessToken, onPresent }: Props) {
  const [open, setOpen] = useState(false);
  const [docs, setDocs] = useState<SharedDocumentSummary[] | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || docs) return;
    listDocuments(patientId, accessToken)
      .then(setDocs)
      .catch(() => setDocs([]));
  }, [open, docs, patientId, accessToken]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const handlePick = async (doc: SharedDocumentSummary) => {
    setLoadingId(doc.id);
    try {
      const { bytes, mimeType } = await downloadDocumentBytes(doc.id, accessToken);
      onPresent({ fileName: doc.fileName, mimeType: mimeType || doc.mimeType }, bytes);
      setOpen(false);
    } catch (err) {
      console.error('[present-doc] download failed', err);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
        title="Présenter un document"
      >
        <FileText className="h-5 w-5" />
      </button>

      {open && (
        <div className="absolute bottom-full left-1/2 mb-2 max-h-80 w-72 -translate-x-1/2 overflow-y-auto rounded-xl border border-border bg-white p-2 shadow-2xl">
          <p className="px-2 py-1 text-xs font-medium text-muted-foreground">Documents du patient</p>
          {docs === null ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : docs.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">Aucun document partagé.</p>
          ) : (
            docs.map((doc) => {
              const presentable = PRESENTABLE.includes(doc.mimeType) && doc.fileSize <= MAX_PRESENT_BYTES;
              const reason = !PRESENTABLE.includes(doc.mimeType)
                ? 'non prévisualisable'
                : doc.fileSize > MAX_PRESENT_BYTES
                ? 'trop volumineux'
                : null;
              return (
                <button
                  key={doc.id}
                  disabled={!presentable || loadingId !== null}
                  onClick={() => handlePick(doc)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingId === doc.id ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4 shrink-0 text-primary" />
                  )}
                  <span className="flex-1 truncate text-foreground">{doc.fileName}</span>
                  {reason && <span className="shrink-0 text-xs text-muted-foreground">{reason}</span>}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Vérifier TypeScript**

Run: `cd apps/web && pnpm tsc --noEmit 2>&1 | grep present-document-picker`
Expected: aucune sortie.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/video/present-document-picker.tsx
git commit -m "feat(video): add PresentDocumentPicker component"
```

---

## Task 8: Intégration côté psy (`video-room.tsx`)

**Files:**
- Modify: `apps/web/src/components/video/video-room.tsx`

- [ ] **Step 1: Brancher le hook, le picker et le panneau**

FIRST read `apps/web/src/components/video/video-room.tsx` fully.

(a) Add imports (merge into existing import lines where possible):
```tsx
import { useDocPresentation } from '@/hooks/use-doc-presentation';
import { DocPresentationPanel } from './doc-presentation-panel';
import { PresentDocumentPicker } from './present-document-picker';
```

(b) Add `patientId?: string | null;` to the `VideoRoomProps` interface AND ensure `patientId` is included in the `Omit<...>` props of `VideoLayout` and passed through (see step (f)). In `VideoLayout`'s param list add `patientId`.

(c) In `VideoLayout`, after the existing `useDocPresentation` is not yet present — add after the `useVideoChat({...})`/`useAdaptiveQuality()` calls:
```tsx
  const docPresentation = useDocPresentation();
```

(d) Render the panel inside the video panel `<div ref={videoPanelRef} ...>`, after `<VideoGrid .../>` (so it overlays the grid):
```tsx
        <DocPresentationPanel
          presented={docPresentation.presented}
          progress={docPresentation.progress}
          canClose
          onClose={docPresentation.closeDocument}
        />
```

(e) Add the picker into the controls. The `inviteSlot` currently is a fragment containing `GuestInvitePopover` and the audio-fallback button. Append the picker inside that same fragment (only when `patientId` exists):
```tsx
                {patientId && (
                  <PresentDocumentPicker
                    patientId={patientId}
                    accessToken={accessToken}
                    onPresent={docPresentation.presentDocument}
                  />
                )}
```

(f) In the exported `PsyVideoRoom` wrapper, accept `patientId` from props and pass it to `<VideoLayout patientId={patientId} ... />`.

- [ ] **Step 2: Vérifier TypeScript**

Run: `cd apps/web && pnpm tsc --noEmit 2>&1 | grep video-room`
Expected: aucune sortie.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/video/video-room.tsx
git commit -m "feat(video): wire document presentation into psy room"
```

---

## Task 9: Intégration côté patient (`patient-video-room.tsx`)

**Files:**
- Modify: `apps/web/src/components/video/patient-video-room.tsx`

- [ ] **Step 1: Brancher le hook et le panneau (réception)**

FIRST read `apps/web/src/components/video/patient-video-room.tsx` fully.

(a) Add imports:
```tsx
import { useDocPresentation } from '@/hooks/use-doc-presentation';
import { DocPresentationPanel } from './doc-presentation-panel';
```

(b) In `PatientLayout`, after the existing `useAdaptiveQuality()` call, add:
```tsx
  const docPresentation = useDocPresentation();
```

(c) Render the panel inside the video zone `<div className="relative flex-1">`, as the LAST child (so it overlays the psy video):
```tsx
        <DocPresentationPanel
          presented={docPresentation.presented}
          progress={docPresentation.progress}
          canClose={false}
        />
```

- [ ] **Step 2: Vérifier TypeScript**

Run: `cd apps/web && pnpm tsc --noEmit 2>&1 | grep patient-video-room`
Expected: aucune sortie.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/video/patient-video-room.tsx
git commit -m "feat(video): show presented document on patient side"
```

---

## Task 10: Passer patientId depuis la page psy

**Files:**
- Modify: `apps/web/src/app/(dashboard)/video/[roomId]/page.tsx`

- [ ] **Step 1: Stocker et transmettre patientId**

In `apps/web/src/app/(dashboard)/video/[roomId]/page.tsx`:

(a) Add state near the others:
```tsx
  const [patientId, setPatientId] = useState<string | null>(null);
```

(b) In the `init` effect, after `setTokenData(data);`, capture patientId:
```tsx
        if (data.patientId) setPatientId(data.patientId);
```

(c) Pass it to `<PsyVideoRoom ... />`:
```tsx
        patientId={patientId}
```

- [ ] **Step 2: Vérifier TypeScript**

Run: `cd apps/web && pnpm tsc --noEmit 2>&1 | grep "roomId"`
Expected: aucune sortie.

- [ ] **Step 3: Commit**

```bash
git add "apps/web/src/app/(dashboard)/video/[roomId]/page.tsx"
git commit -m "feat(video): pass patientId to psy video room for document picker"
```

---

## Task 11: Vérification finale + déploiement

- [ ] **Step 1: Suite de tests web**

Run: `cd apps/web && pnpm vitest run`
Expected: tous les tests passent (dont `chunk` + `use-doc-presentation`), aucune régression.

- [ ] **Step 2: Build web**

Run: `cd apps/web && pnpm build 2>&1 | tail -20`
Expected: build réussi.

- [ ] **Step 3: Build API (typecheck)**

Run: `pnpm --filter api exec tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 4: Déploiement Vercel (frontend)**

Run: `cd C:/Users/tonyr/OneDrive/Projet/PsyFlow && npx vercel --prod --yes`

- [ ] **Step 5: Déploiement API VPS**

Suivre la procédure manuelle habituelle (voir mémoire `cicd-infra` / déploiement API) :
1. `tar` du code source (exclure node_modules, .next, dist, apps/web, apps/mobile, tmp/, etc.)
2. `scp -i ~/.ssh/psyscale_ovh` vers le VPS → `/opt/psyscale-api/`
3. Extraire, `docker build -t psyscale-api:latest .`
4. `docker compose down api && docker compose up -d api`
5. PAS de migration (aucun changement schema)
6. `docker compose restart api`

- [ ] **Step 6: Test manuel**

1. Côté psy en visio : bouton 📄 dans la barre → liste des documents du patient ; DOCX/ODT et >5 Mo grisés.
2. Cliquer un PDF → il s'affiche en overlay côté psy ET côté patient.
3. Cliquer une image → idem.
4. Bouton fermer (psy) → le document disparaît des deux côtés.
5. Vérifier que le chat fonctionne toujours pendant une présentation (coexistence DataChannel).

- [ ] **Step 7: Mettre à jour la mémoire projet**

Ajouter dans `memory/video-consultation.md` une section « Présentation de documents en direct ✅ DÉPLOYÉ (2026-06-05) » résumant : transport P2P DataChannel (topic `doc-*`, coexiste avec chat), endpoint `GET /documents/:id/download`, `patientId` dans token psy, plafond 5 Mo, hooks/composants créés, déployé Vercel + VPS.

---

## Self-Review

- **Couverture spec :** Section 1 (backend download) → Task 1 ; patientId → Task 2. Section 2 (chunk pur → Task 3 ; client API → Task 4 ; hook → Task 5 ; panel → Task 6 ; picker → Task 7 ; intégrations → Tasks 8-10). Section 3 (tests dans 3 & 5 ; non-régression coexistence chat testée Task 5 ; déploiement Vercel+VPS → Task 11). ✅
- **Placeholders :** aucun — code complet partout. La seule note de vérification (forme de retour de `GET /documents`) est explicite et bornée. ✅
- **Cohérence des types :** `PresentedDoc` (fileName/mimeType/url) cohérent hook ↔ panel. `SharedDocumentSummary` cohérent client ↔ picker. `VideoTokenResponse.patientId` ajouté côté API (Task 2) ET frontend (Task 4) ET propagé page → PsyVideoRoom → VideoLayout → picker (Tasks 8, 10). Messages DataChannel `doc-start/doc-chunk/doc-close` cohérents émetteur ↔ récepteur. `CHUNK_SIZE` en octets, `bytesToChunks` applique la taille aux octets bruts (cohérent avec le test round-trip). ✅
```
