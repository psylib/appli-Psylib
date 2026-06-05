# Test pré-appel + Fallback audio adaptatif — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un test pré-appel (micro/VU-mètre, caméra, sélection périphérique, test haut-parleur, bande passante) côté patient et invité, et un fallback audio-only adaptatif (auto + manuel) côté psy et patient pendant la séance.

**Architecture:** La logique de mesure de bande passante est isolée dans un module pur `lib/video/bandwidth.ts` (testable sans DOM). Un hook `use-precall-check` encapsule devices/VU-mètre/bande passante pour la salle d'attente ; un composant `precall-checklist` l'affiche. Un hook `use-adaptive-quality` écoute la qualité LiveKit et coupe/restaure la vidéo (anti-flapping) ; un composant `connection-banner` l'expose. Aucun changement backend, aucune migration.

**Tech Stack:** Next.js App Router, LiveKit components-react v2, livekit-client, Web Audio API, Vitest + @testing-library/react, Tailwind, lucide-react.

---

## File Map

```
apps/web/src/
  lib/video/
    bandwidth.ts                    ← NEW  logique pure mesure + classification
    __tests__/bandwidth.test.ts     ← NEW
  hooks/
    use-precall-check.ts            ← NEW  devices + VU-mètre + bande passante
    use-adaptive-quality.ts         ← NEW  fallback audio (anti-flapping)
    __tests__/
      use-adaptive-quality.test.ts  ← NEW
  components/video/
    precall-checklist.tsx           ← NEW  UI VU-mètre + selects + badge bw + test son
    connection-banner.tsx           ← NEW  bandeau fallback réutilisable
    waiting-room.tsx                ← MOD  intègre precall-checklist
    patient-video-room.tsx          ← MOD  props devices + adaptive quality + banner
    video-room.tsx                  ← MOD  adaptive quality + banner + bouton manuel
  app/(patient-video)/
    patient-portal/video/[token]/page.tsx  ← MOD  porte les devices sélectionnés
    video/guest/[token]/page.tsx           ← MOD  precall dans l'étape "form"
apps/web/public/
  bandwidth-probe.bin               ← NEW  asset ~800 KB
```

---

## Task 1: Module pur de bande passante

**Files:**
- Create: `apps/web/src/lib/video/bandwidth.ts`
- Test: `apps/web/src/lib/video/__tests__/bandwidth.test.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/lib/video/__tests__/bandwidth.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { classifyBandwidth, measureBandwidth } from '../bandwidth';

describe('classifyBandwidth', () => {
  it('returns good at or above 1.5 Mbps', () => {
    expect(classifyBandwidth(1.5)).toBe('good');
    expect(classifyBandwidth(5)).toBe('good');
  });
  it('returns fair between 0.5 and 1.5 Mbps', () => {
    expect(classifyBandwidth(0.5)).toBe('fair');
    expect(classifyBandwidth(1.4)).toBe('fair');
  });
  it('returns poor below 0.5 Mbps', () => {
    expect(classifyBandwidth(0.49)).toBe('poor');
    expect(classifyBandwidth(0)).toBe('poor');
  });
});

describe('measureBandwidth', () => {
  it('computes mbps from payload size and elapsed time', async () => {
    // 800_000 bytes downloaded in 1000ms => 800000*8/1e6 / 1 = 6.4 Mbps
    const bytes = 800_000;
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(bytes),
    });
    const times = [0, 1000];
    const now = vi.fn(() => times.shift() ?? 1000);
    const result = await measureBandwidth('/bandwidth-probe.bin', { fetchImpl, now });
    expect(result.status).toBe('done');
    expect(result.mbps).toBeCloseTo(6.4, 1);
    expect(result.quality).toBe('good');
  });

  it('returns error status when fetch rejects', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('network'));
    const result = await measureBandwidth('/bandwidth-probe.bin', { fetchImpl, now: () => 0 });
    expect(result.status).toBe('error');
    expect(result.quality).toBe('poor');
  });

  it('returns error status when response not ok', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, arrayBuffer: async () => new ArrayBuffer(0) });
    const result = await measureBandwidth('/bandwidth-probe.bin', { fetchImpl, now: () => 0 });
    expect(result.status).toBe('error');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm vitest run src/lib/video/__tests__/bandwidth.test.ts`
Expected: FAIL — module `../bandwidth` introuvable.

- [ ] **Step 3: Write minimal implementation**

Create `apps/web/src/lib/video/bandwidth.ts`:

```ts
export type BandwidthQuality = 'good' | 'fair' | 'poor';
export type BandwidthStatus = 'testing' | 'done' | 'error';

export interface BandwidthResult {
  mbps: number;
  quality: BandwidthQuality;
  status: BandwidthStatus;
}

/** Seuils alignés sur LiveKit VP9 720p. */
export function classifyBandwidth(mbps: number): BandwidthQuality {
  if (mbps >= 1.5) return 'good';
  if (mbps >= 0.5) return 'fair';
  return 'poor';
}

interface MeasureOptions {
  fetchImpl?: typeof fetch;
  now?: () => number;
}

/**
 * Sonde de débit active : télécharge un asset de taille connue et mesure le
 * débit descendant. Non bloquant — en cas d'échec renvoie status 'error'.
 */
export async function measureBandwidth(
  probeUrl: string,
  opts: MeasureOptions = {},
): Promise<BandwidthResult> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const now = opts.now ?? (() => performance.now());
  try {
    const start = now();
    const res = await fetchImpl(`${probeUrl}?t=${start}`, { cache: 'no-store' });
    if (!res.ok) return { mbps: 0, quality: 'poor', status: 'error' };
    const buf = await res.arrayBuffer();
    const elapsedSec = Math.max((now() - start) / 1000, 0.001);
    const mbps = (buf.byteLength * 8) / 1e6 / elapsedSec;
    return { mbps, quality: classifyBandwidth(mbps), status: 'done' };
  } catch {
    return { mbps: 0, quality: 'poor', status: 'error' };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && pnpm vitest run src/lib/video/__tests__/bandwidth.test.ts`
Expected: PASS — 6 tests.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/video/bandwidth.ts apps/web/src/lib/video/__tests__/bandwidth.test.ts
git commit -m "feat(video): add pure bandwidth measure + classify module"
```

---

## Task 2: Asset de sonde de bande passante

**Files:**
- Create: `apps/web/public/bandwidth-probe.bin`

- [ ] **Step 1: Générer un fichier binaire d'environ 800 KB**

Run (PowerShell):
```powershell
$bytes = New-Object byte[] 819200
(New-Object Random).NextBytes($bytes)
[IO.File]::WriteAllBytes("apps/web/public/bandwidth-probe.bin", $bytes)
```
Expected: fichier de 819200 octets créé. Vérifier : `(Get-Item apps/web/public/bandwidth-probe.bin).Length` → `819200`.

- [ ] **Step 2: Commit**

```bash
git add apps/web/public/bandwidth-probe.bin
git commit -m "feat(video): add 800KB static asset for bandwidth probe"
```

---

## Task 3: Hook `use-precall-check`

**Files:**
- Create: `apps/web/src/hooks/use-precall-check.ts`

> Ce hook orchestre `getUserMedia`, `enumerateDevices`, un `AnalyserNode` Web Audio pour le VU-mètre, et `measureBandwidth`. Sa logique réseau pure est déjà couverte par les tests du Task 1 ; ici on n'ajoute pas de test unitaire (effets DOM/Audio lourds à mocker, faible valeur), on s'appuie sur la vérification manuelle du Task 9.

- [ ] **Step 1: Implémenter le hook**

Create `apps/web/src/hooks/use-precall-check.ts`:

```ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { measureBandwidth, type BandwidthResult } from '@/lib/video/bandwidth';

export type DeviceKind = 'mic' | 'cam' | 'speaker';

export interface PrecallDevices {
  mics: MediaDeviceInfo[];
  cams: MediaDeviceInfo[];
  speakers: MediaDeviceInfo[];
}

export interface PrecallSelected {
  micId?: string;
  camId?: string;
  speakerId?: string;
}

export interface UsePrecallCheckReturn {
  stream: MediaStream | null;
  audioLevel: number;
  bandwidth: BandwidthResult;
  devices: PrecallDevices;
  selected: PrecallSelected;
  setDevice: (kind: DeviceKind, id: string) => void;
  testSpeaker: () => void;
  error: string | null;
}

const PROBE_URL = '/bandwidth-probe.bin';

export function usePrecallCheck(): UsePrecallCheckReturn {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [bandwidth, setBandwidth] = useState<BandwidthResult>({ mbps: 0, quality: 'good', status: 'testing' });
  const [devices, setDevices] = useState<PrecallDevices>({ mics: [], cams: [], speakers: [] });
  const [selected, setSelected] = useState<PrecallSelected>({});
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // (Re)acquire the media stream for the current selection.
  const acquire = useCallback(async (sel: PrecallSelected) => {
    try {
      stopStream();
      const constraints: MediaStreamConstraints = {
        audio: sel.micId ? { deviceId: { exact: sel.micId } } : true,
        video: sel.camId ? { deviceId: { exact: sel.camId } } : true,
      };
      const ms = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = ms;
      setStream(ms);
      setError(null);

      // Enumerate devices now that we have permission (labels populated).
      const all = await navigator.mediaDevices.enumerateDevices();
      setDevices({
        mics: all.filter((d) => d.kind === 'audioinput'),
        cams: all.filter((d) => d.kind === 'videoinput'),
        speakers: all.filter((d) => d.kind === 'audiooutput'),
      });

      // Wire VU-meter via Web Audio.
      audioCtxRef.current?.close().catch(() => {});
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(ms);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        setAudioLevel(Math.min(1, Math.sqrt(sum / data.length) * 3));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      setError("Impossible d'acceder a votre camera ou micro. Verifiez les permissions de votre navigateur.");
    }
  }, [stopStream]);

  // Initial acquisition + bandwidth probe on mount.
  useEffect(() => {
    acquire({});
    measureBandwidth(PROBE_URL).then(setBandwidth);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      audioCtxRef.current?.close().catch(() => {});
      stopStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setDevice = useCallback((kind: DeviceKind, id: string) => {
    setSelected((prev) => {
      const next: PrecallSelected = { ...prev };
      if (kind === 'mic') next.micId = id;
      if (kind === 'cam') next.camId = id;
      if (kind === 'speaker') next.speakerId = id;
      if (kind !== 'speaker') acquire(next); // speaker change does not affect capture
      return next;
    });
  }, [acquire]);

  const testSpeaker = useCallback(() => {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 440;
    gain.gain.value = 0.15;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    setTimeout(() => { osc.stop(); ctx.close().catch(() => {}); }, 600);
  }, []);

  return { stream, audioLevel, bandwidth, devices, selected, setDevice, testSpeaker, error };
}
```

- [ ] **Step 2: Vérifier TypeScript**

Run: `cd apps/web && pnpm tsc --noEmit 2>&1 | grep use-precall-check`
Expected: aucune sortie (aucune erreur).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/hooks/use-precall-check.ts
git commit -m "feat(video): add usePrecallCheck hook — devices, VU-meter, bandwidth"
```

---

## Task 4: Composant `precall-checklist`

**Files:**
- Create: `apps/web/src/components/video/precall-checklist.tsx`

- [ ] **Step 1: Implémenter le composant**

Create `apps/web/src/components/video/precall-checklist.tsx`:

```tsx
'use client';

import { Mic, MicOff, Wifi, Volume2 } from 'lucide-react';
import type { UsePrecallCheckReturn } from '@/hooks/use-precall-check';

const QUALITY_META = {
  good: { label: 'Bonne connexion', cls: 'text-green-600', dot: 'bg-green-500' },
  fair: { label: 'Connexion correcte', cls: 'text-amber-600', dot: 'bg-amber-500' },
  poor: { label: 'Connexion faible — l’audio sera privilégié', cls: 'text-red-600', dot: 'bg-red-500' },
} as const;

interface Props {
  check: UsePrecallCheckReturn;
}

export function PrecallChecklist({ check }: Props) {
  const { audioLevel, bandwidth, devices, selected, setDevice, testSpeaker } = check;
  const q = QUALITY_META[bandwidth.quality];
  const micSilent = audioLevel < 0.02;

  return (
    <div className="space-y-3 text-left">
      {/* VU-mètre */}
      <div>
        <div className="mb-1 flex items-center gap-1.5 text-sm text-foreground">
          {micSilent ? <MicOff className="h-4 w-4 text-muted-foreground" /> : <Mic className="h-4 w-4 text-green-600" />}
          <span>Micro</span>
          {micSilent && <span className="text-xs text-muted-foreground">— parlez pour tester</span>}
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-green-500 transition-[width] duration-75"
            style={{ width: `${Math.round(audioLevel * 100)}%` }}
          />
        </div>
      </div>

      {/* Sélecteurs périphériques */}
      {devices.mics.length > 1 && (
        <DeviceSelect label="Micro" value={selected.micId} options={devices.mics} onChange={(id) => setDevice('mic', id)} />
      )}
      {devices.cams.length > 1 && (
        <DeviceSelect label="Caméra" value={selected.camId} options={devices.cams} onChange={(id) => setDevice('cam', id)} />
      )}
      {devices.speakers.length > 1 && (
        <DeviceSelect label="Haut-parleur" value={selected.speakerId} options={devices.speakers} onChange={(id) => setDevice('speaker', id)} />
      )}

      {/* Test son + bande passante */}
      <div className="flex items-center justify-between">
        <button
          onClick={testSpeaker}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-muted"
        >
          <Volume2 className="h-4 w-4" /> Tester le son
        </button>
        <div className={`inline-flex items-center gap-1.5 text-sm ${q.cls}`}>
          {bandwidth.status === 'testing' ? (
            <span className="text-muted-foreground">Test connexion…</span>
          ) : (
            <>
              <Wifi className="h-4 w-4" />
              <span className={`h-2 w-2 rounded-full ${q.dot}`} />
              {q.label}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DeviceSelect({
  label, value, options, onChange,
}: {
  label: string;
  value?: string;
  options: MediaDeviceInfo[];
  onChange: (id: string) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-muted-foreground">{label}</span>
      <select
        value={value ?? options[0]?.deviceId}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-white px-2 py-1.5 text-sm focus:ring-2 focus:ring-primary"
      >
        {options.map((d) => (
          <option key={d.deviceId} value={d.deviceId}>
            {d.label || `${label} ${d.deviceId.slice(0, 6)}`}
          </option>
        ))}
      </select>
    </label>
  );
}
```

- [ ] **Step 2: Vérifier TypeScript**

Run: `cd apps/web && pnpm tsc --noEmit 2>&1 | grep precall-checklist`
Expected: aucune sortie.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/video/precall-checklist.tsx
git commit -m "feat(video): add PrecallChecklist component"
```

---

## Task 5: Intégrer le test pré-appel dans `WaitingRoom`

**Files:**
- Modify: `apps/web/src/components/video/waiting-room.tsx`

- [ ] **Step 1: Réécrire `waiting-room.tsx`**

Replace the entire file content of `apps/web/src/components/video/waiting-room.tsx`:

```tsx
'use client';

import { useEffect, useRef } from 'react';
import { usePrecallCheck, type PrecallSelected } from '@/hooks/use-precall-check';
import { PrecallChecklist } from './precall-checklist';

interface WaitingRoomProps {
  psychologistName: string;
  onReady: () => void;
  /** Appelé avec les périphériques choisis juste avant d'entrer. */
  onDevicesSelected?: (selected: PrecallSelected) => void;
}

export function WaitingRoom({ psychologistName, onReady, onDevicesSelected }: WaitingRoomProps) {
  const check = usePrecallCheck();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && check.stream) {
      videoRef.current.srcObject = check.stream;
    }
  }, [check.stream]);

  void psychologistName;

  const canJoin = !!check.stream;

  const handleJoin = () => {
    onDevicesSelected?.(check.selected);
    onReady();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="mb-1 text-xl font-bold text-foreground">PsyLib</h1>
        <p className="mb-6 text-sm text-muted-foreground">Consultation video</p>

        <div className="relative mx-auto mb-4 h-48 w-64 overflow-hidden rounded-xl bg-gray-900">
          {check.error ? (
            <div className="flex h-full items-center justify-center p-4 text-sm text-red-400">{check.error}</div>
          ) : (
            <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
          )}
        </div>

        <div className="mx-auto mb-6 max-w-xs">
          <PrecallChecklist check={check} />
        </div>

        <p className="mb-2 font-medium text-foreground">
          Votre psychologue va vous recevoir dans quelques instants...
        </p>
        <div className="flex items-center justify-center gap-2 text-accent">
          <div className="h-2 w-2 animate-pulse rounded-full bg-accent" />
          <span className="text-sm">En attente</span>
        </div>

        <button
          onClick={handleJoin}
          disabled={!canJoin}
          className="mt-6 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          Rejoindre la consultation
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Vérifier TypeScript**

Run: `cd apps/web && pnpm tsc --noEmit 2>&1 | grep waiting-room`
Expected: aucune sortie.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/video/waiting-room.tsx
git commit -m "feat(video): integrate precall checklist into WaitingRoom"
```

---

## Task 6: Porter les périphériques jusqu'à `PatientVideoRoom`

**Files:**
- Modify: `apps/web/src/components/video/patient-video-room.tsx`
- Modify: `apps/web/src/app/(patient-video)/patient-portal/video/[token]/page.tsx`

- [ ] **Step 1: Ajouter les props devices à `PatientVideoRoom`**

In `apps/web/src/components/video/patient-video-room.tsx`, add imports at the top of the existing import block:

```tsx
import { videoRoomOptions } from '@/lib/video/livekit-options';
```
(déjà présent — ne pas dupliquer)

Replace the `PatientVideoRoomProps` interface and the `PatientVideoRoom` function (the exported wrapper at the bottom of the file) with:

```tsx
interface PatientVideoRoomProps {
  token: string;
  wsUrl: string;
  onConnectionFailed: () => void;
  exitHref?: string;
  exitLabel?: string;
  patientName?: string;
  micId?: string;
  camId?: string;
  speakerId?: string;
}

export function PatientVideoRoom({
  token,
  wsUrl,
  onConnectionFailed,
  exitHref,
  exitLabel,
  patientName,
  micId,
  camId,
  speakerId,
}: PatientVideoRoomProps) {
  const options = {
    ...videoRoomOptions,
    audioCaptureDefaults: {
      ...videoRoomOptions.audioCaptureDefaults,
      ...(micId ? { deviceId: micId } : {}),
    },
    videoCaptureDefaults: {
      ...videoRoomOptions.videoCaptureDefaults,
      ...(camId ? { deviceId: camId } : {}),
    },
  };
  return (
    <LiveKitRoom serverUrl={wsUrl} token={token} connect={true} video={true} audio={true} options={options}>
      <PatientLayout
        onConnectionFailed={onConnectionFailed}
        exitHref={exitHref}
        exitLabel={exitLabel}
        patientName={patientName}
        speakerId={speakerId}
      />
    </LiveKitRoom>
  );
}
```

- [ ] **Step 2: Appliquer le haut-parleur dans `PatientLayout`**

In the same file, add `speakerId?: string;` to the `PatientLayoutProps` interface, add `speakerId` to the destructured params of `PatientLayout`, and add this effect right after the `const room = useRoomContext();` line:

```tsx
  useEffect(() => {
    if (speakerId) {
      room.switchActiveDevice('audiooutput', speakerId).catch(() => {});
    }
  }, [room, speakerId]);
```

- [ ] **Step 3: Porter les devices dans la page patient**

In `apps/web/src/app/(patient-video)/patient-portal/video/[token]/page.tsx`:

Add a state near the other `useState` calls:
```tsx
  const [devices, setDevices] = useState<{ micId?: string; camId?: string; speakerId?: string }>({});
```

Pass the callback to `WaitingRoom` (replace the existing waiting return):
```tsx
  if (phase === 'waiting') {
    return (
      <WaitingRoom
        psychologistName={psychologistName}
        onReady={handleReady}
        onDevicesSelected={setDevices}
      />
    );
  }
```

Pass the devices to `PatientVideoRoom` (replace the existing call return):
```tsx
  if (phase === 'call' && tokenData) {
    return (
      <PatientVideoRoom
        token={tokenData.token}
        wsUrl={tokenData.wsUrl}
        onConnectionFailed={handleConnectionFailed}
        patientName={patientName}
        micId={devices.micId}
        camId={devices.camId}
        speakerId={devices.speakerId}
      />
    );
  }
```

- [ ] **Step 4: Vérifier TypeScript**

Run: `cd apps/web && pnpm tsc --noEmit 2>&1 | grep -E "patient-video-room|video/\[token\]"`
Expected: aucune sortie.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/video/patient-video-room.tsx "apps/web/src/app/(patient-video)/patient-portal/video/[token]/page.tsx"
git commit -m "feat(video): carry selected devices from waiting room into patient call"
```

---

## Task 7: Test pré-appel pour l'invité (étape form)

**Files:**
- Modify: `apps/web/src/app/(patient-video)/video/guest/[token]/page.tsx`

- [ ] **Step 1: Ajouter le hook + checklist dans l'étape form**

In `apps/web/src/app/(patient-video)/video/guest/[token]/page.tsx`:

Add imports:
```tsx
import { usePrecallCheck } from '@/hooks/use-precall-check';
import { PrecallChecklist } from '@/components/video/precall-checklist';
```

Add the hook call near the top of the `GuestVideoPage` component body (after the existing `useState` declarations):
```tsx
  const precall = usePrecallCheck();
```

Add devices state:
```tsx
  const [guestDevices, setGuestDevices] = useState<{ micId?: string; camId?: string; speakerId?: string }>({});
```

In `handleSubmit`, capture the selected devices just before `setPhase('waiting')`:
```tsx
      setGuestDevices(precall.selected);
      sessionTokenRef.current = res.sessionToken;
      setPhase('waiting');
```

Inside the `phase === 'form'` block, insert the checklist right before the `<label ... htmlFor="guest-name">` element:
```tsx
          <div className="mt-4">
            <PrecallChecklist check={precall} />
          </div>
```

Pass devices to `PatientVideoRoom` in the `phase === 'call'` block:
```tsx
      <PatientVideoRoom
        token={tokenData.token}
        wsUrl={tokenData.wsUrl}
        onConnectionFailed={handleConnectionFailed}
        exitHref="/"
        exitLabel="Fermer"
        micId={guestDevices.micId}
        camId={guestDevices.camId}
        speakerId={guestDevices.speakerId}
      />
```

- [ ] **Step 2: Vérifier TypeScript**

Run: `cd apps/web && pnpm tsc --noEmit 2>&1 | grep "guest/\[token\]"`
Expected: aucune sortie.

- [ ] **Step 3: Commit**

```bash
git add "apps/web/src/app/(patient-video)/video/guest/[token]/page.tsx"
git commit -m "feat(video): add precall checklist to guest join form"
```

---

## Task 8: Hook `use-adaptive-quality` (fallback audio)

**Files:**
- Create: `apps/web/src/hooks/use-adaptive-quality.ts`
- Test: `apps/web/src/hooks/__tests__/use-adaptive-quality.test.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/hooks/__tests__/use-adaptive-quality.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ConnectionQuality, RoomEvent } from 'livekit-client';

const mockSetCameraEnabled = vi.fn().mockResolvedValue(undefined);
const localParticipant = { isLocal: true, setCameraEnabled: mockSetCameraEnabled };
const handlers: Record<string, (...args: unknown[]) => void> = {};
const mockRoom = {
  localParticipant,
  on: vi.fn((evt: string, cb: (...args: unknown[]) => void) => { handlers[evt] = cb; }),
  off: vi.fn(),
};

vi.mock('@livekit/components-react', () => ({
  useRoomContext: () => mockRoom,
  useLocalParticipant: () => ({ localParticipant, isCameraEnabled: true }),
}));

import { useAdaptiveQuality } from '../use-adaptive-quality';

function emitQuality(q: ConnectionQuality) {
  act(() => { handlers[RoomEvent.ConnectionQualityChanged]?.(q, localParticipant); });
}

describe('useAdaptiveQuality', () => {
  beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('does not degrade before 6s of poor quality', () => {
    const { result } = renderHook(() => useAdaptiveQuality());
    emitQuality(ConnectionQuality.Poor);
    act(() => { vi.advanceTimersByTime(5000); });
    expect(mockSetCameraEnabled).not.toHaveBeenCalled();
    expect(result.current.degraded).toBe(false);
  });

  it('auto-degrades after 6s of continuous poor quality', () => {
    const { result } = renderHook(() => useAdaptiveQuality());
    emitQuality(ConnectionQuality.Poor);
    act(() => { vi.advanceTimersByTime(6000); });
    expect(mockSetCameraEnabled).toHaveBeenCalledWith(false);
    expect(result.current.degraded).toBe(true);
    expect(result.current.reason).toBe('auto');
  });

  it('cancels degrade timer if quality recovers in time', () => {
    renderHook(() => useAdaptiveQuality());
    emitQuality(ConnectionQuality.Poor);
    act(() => { vi.advanceTimersByTime(3000); });
    emitQuality(ConnectionQuality.Good);
    act(() => { vi.advanceTimersByTime(5000); });
    expect(mockSetCameraEnabled).not.toHaveBeenCalled();
  });

  it('forceAudioOnly disables camera with manual reason', () => {
    const { result } = renderHook(() => useAdaptiveQuality());
    act(() => { result.current.forceAudioOnly(); });
    expect(mockSetCameraEnabled).toHaveBeenCalledWith(false);
    expect(result.current.reason).toBe('manual');
  });

  it('restoreVideo re-enables camera and clears degraded state', () => {
    const { result } = renderHook(() => useAdaptiveQuality());
    act(() => { result.current.forceAudioOnly(); });
    act(() => { result.current.restoreVideo(); });
    expect(mockSetCameraEnabled).toHaveBeenLastCalledWith(true);
    expect(result.current.degraded).toBe(false);
    expect(result.current.reason).toBe(null);
  });

  it('cleans up listener on unmount', () => {
    const { unmount } = renderHook(() => useAdaptiveQuality());
    unmount();
    expect(mockRoom.off).toHaveBeenCalledWith(RoomEvent.ConnectionQualityChanged, expect.any(Function));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm vitest run src/hooks/__tests__/use-adaptive-quality.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Write implementation**

Create `apps/web/src/hooks/use-adaptive-quality.ts`:

```ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { ConnectionQuality, RoomEvent, type Participant } from 'livekit-client';

const POOR_GRACE_MS = 6000;

export type DegradeReason = 'auto' | 'manual' | null;

export interface UseAdaptiveQualityReturn {
  degraded: boolean;
  reason: DegradeReason;
  connectionPoor: boolean;
  forceAudioOnly: () => void;
  restoreVideo: () => void;
}

export function useAdaptiveQuality(): UseAdaptiveQualityReturn {
  const room = useRoomContext();
  const [degraded, setDegraded] = useState(false);
  const [reason, setReason] = useState<DegradeReason>(null);
  const [connectionPoor, setConnectionPoor] = useState(false);

  const degradedRef = useRef(false);
  const poorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setCamera = useCallback((on: boolean) => {
    room.localParticipant.setCameraEnabled(on).catch(() => {});
  }, [room]);

  const clearPoorTimer = () => {
    if (poorTimer.current) { clearTimeout(poorTimer.current); poorTimer.current = null; }
  };

  useEffect(() => {
    const onQuality = (quality: ConnectionQuality, participant: Participant) => {
      if (!participant.isLocal) return;
      const poor = quality === ConnectionQuality.Poor;
      setConnectionPoor(poor);

      if (poor) {
        if (!degradedRef.current && !poorTimer.current) {
          poorTimer.current = setTimeout(() => {
            poorTimer.current = null;
            degradedRef.current = true;
            setDegraded(true);
            setReason('auto');
            setCamera(false);
          }, POOR_GRACE_MS);
        }
      } else {
        clearPoorTimer();
      }
    };

    room.on(RoomEvent.ConnectionQualityChanged, onQuality);
    return () => {
      room.off(RoomEvent.ConnectionQualityChanged, onQuality);
      clearPoorTimer();
    };
  }, [room, setCamera]);

  const forceAudioOnly = useCallback(() => {
    clearPoorTimer();
    degradedRef.current = true;
    setDegraded(true);
    setReason('manual');
    setCamera(false);
  }, [setCamera]);

  const restoreVideo = useCallback(() => {
    clearPoorTimer();
    degradedRef.current = false;
    setDegraded(false);
    setReason(null);
    setCamera(true);
  }, [setCamera]);

  return { degraded, reason, connectionPoor, forceAudioOnly, restoreVideo };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && pnpm vitest run src/hooks/__tests__/use-adaptive-quality.test.ts`
Expected: PASS — 6 tests.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/hooks/use-adaptive-quality.ts apps/web/src/hooks/__tests__/use-adaptive-quality.test.ts
git commit -m "feat(video): add useAdaptiveQuality hook — audio-only fallback"
```

---

## Task 9: Composant `connection-banner`

**Files:**
- Create: `apps/web/src/components/video/connection-banner.tsx`

- [ ] **Step 1: Implémenter le composant**

Create `apps/web/src/components/video/connection-banner.tsx`:

```tsx
'use client';

import { WifiOff, Video } from 'lucide-react';
import type { UseAdaptiveQualityReturn } from '@/hooks/use-adaptive-quality';

interface Props {
  quality: UseAdaptiveQualityReturn;
}

export function ConnectionBanner({ quality }: Props) {
  const { degraded, reason, connectionPoor, restoreVideo } = quality;

  // Dégradé : afficher le mode audio + bouton réactiver.
  if (degraded) {
    const recovered = reason === 'auto' && !connectionPoor;
    return (
      <div className="absolute left-1/2 top-4 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full bg-gray-900/90 px-4 py-2 text-sm text-white shadow-lg backdrop-blur">
        <WifiOff className="h-4 w-4 text-amber-400" />
        <span>{recovered ? 'Connexion rétablie' : 'Mode audio — connexion faible'}</span>
        <button
          onClick={restoreVideo}
          className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-medium hover:bg-white/25"
        >
          <Video className="h-3.5 w-3.5" /> Réactiver la vidéo
        </button>
      </div>
    );
  }

  return null;
}
```

- [ ] **Step 2: Vérifier TypeScript**

Run: `cd apps/web && pnpm tsc --noEmit 2>&1 | grep connection-banner`
Expected: aucune sortie.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/video/connection-banner.tsx
git commit -m "feat(video): add ConnectionBanner component"
```

---

## Task 10: Intégrer le fallback dans `patient-video-room`

**Files:**
- Modify: `apps/web/src/components/video/patient-video-room.tsx`

- [ ] **Step 1: Brancher le hook et le bandeau**

In `apps/web/src/components/video/patient-video-room.tsx`:

Add imports:
```tsx
import { WifiOff } from 'lucide-react';
import { useAdaptiveQuality } from '@/hooks/use-adaptive-quality';
import { ConnectionBanner } from './connection-banner';
```

In `PatientLayout`, add the hook after the existing `useVideoChat` call:
```tsx
  const adaptive = useAdaptiveQuality();
```

Render `<ConnectionBanner quality={adaptive} />` as the first child inside the top-level returned `<div className="relative flex h-screen flex-col bg-gray-900">` (just before `<div className="relative flex-1">`).

Add a manual fallback button in the controls bar — insert it right before the chat button:
```tsx
        <button
          onClick={adaptive.degraded ? adaptive.restoreVideo : adaptive.forceAudioOnly}
          className={`relative rounded-full p-3 text-white ${adaptive.degraded ? 'bg-amber-600 hover:bg-amber-700' : 'bg-gray-700 hover:bg-gray-600'}`}
          title={adaptive.degraded ? 'Réactiver la vidéo' : 'Passer en audio seul'}
        >
          <WifiOff className="h-5 w-5" />
        </button>
```

- [ ] **Step 2: Vérifier TypeScript**

Run: `cd apps/web && pnpm tsc --noEmit 2>&1 | grep patient-video-room`
Expected: aucune sortie.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/video/patient-video-room.tsx
git commit -m "feat(video): wire adaptive audio fallback into patient room"
```

---

## Task 11: Intégrer le fallback dans `video-room` (psy)

**Files:**
- Modify: `apps/web/src/components/video/video-room.tsx`

- [ ] **Step 1: Brancher le hook et le bandeau côté psy**

In `apps/web/src/components/video/video-room.tsx`:

Add imports (merge into existing import lines):
```tsx
import { useAdaptiveQuality } from '@/hooks/use-adaptive-quality';
import { ConnectionBanner } from './connection-banner';
import { WifiOff } from 'lucide-react';
```

In `VideoLayout`, add the hook after the existing `useVideoChat` call:
```tsx
  const adaptive = useAdaptiveQuality();
```

Render `<ConnectionBanner quality={adaptive} />` inside the video panel `<div ref={videoPanelRef} ...>`, right after the opening tag (before the `isReconnecting` block).

Add a manual button into the floating `VideoControls` via a new slot. Pass it through `chatSlot`'s sibling — insert directly in the controls by adding this button to the `inviteSlot` area. Concretely, wrap the existing `inviteSlot` prop value to include the fallback button:

```tsx
            inviteSlot={
              <>
                <GuestInvitePopover appointmentId={appointmentId} />
                <button
                  onClick={adaptive.degraded ? adaptive.restoreVideo : adaptive.forceAudioOnly}
                  className={`rounded-full p-3 text-white transition-colors ${adaptive.degraded ? 'bg-amber-600 hover:bg-amber-700' : 'bg-white/10 hover:bg-white/20'}`}
                  title={adaptive.degraded ? 'Réactiver la vidéo' : 'Passer en audio seul'}
                >
                  <WifiOff className="h-5 w-5" />
                </button>
              </>
            }
```

- [ ] **Step 2: Vérifier TypeScript**

Run: `cd apps/web && pnpm tsc --noEmit 2>&1 | grep video-room`
Expected: aucune sortie.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/video/video-room.tsx
git commit -m "feat(video): wire adaptive audio fallback into psy room"
```

---

## Task 12: Vérification finale + déploiement

- [ ] **Step 1: Lancer toute la suite de tests**

Run: `cd apps/web && pnpm vitest run`
Expected: tous les tests passent (dont les nouveaux bandwidth + adaptive-quality), aucune régression.

- [ ] **Step 2: Build Next.js**

Run: `cd apps/web && pnpm build 2>&1 | tail -20`
Expected: build réussi, aucune erreur TypeScript.

- [ ] **Step 3: Déploiement Vercel**

Run: `cd C:/Users/tonyr/OneDrive/Projet/PsyFlow && npx vercel --prod --yes`
Expected: déploiement prod réussi.

- [ ] **Step 4: Test manuel**

1. Ouvrir un lien patient → salle d'attente : VU-mètre bouge quand on parle, badge bande passante affiché, sélecteurs périphériques présents si plusieurs devices, bouton « Tester le son » émet un bip.
2. Rejoindre → vérifier que le micro/caméra choisis sont actifs.
3. Simuler une connexion faible (DevTools → Network throttling « Slow 3G ») → après ~6s, la vidéo se coupe, bandeau « Mode audio — connexion faible » apparaît, bouton « Réactiver la vidéo » fonctionne.
4. Côté psy : même bouton manuel « Passer en audio seul » dans la barre flottante.
5. Tester le lien invité : checklist visible dans l'étape « Demander à rejoindre ».

- [ ] **Step 5: Mettre à jour la mémoire projet**

Ajouter dans `C:\Users\tonyr\.claude\projects\C--Users-tonyr-OneDrive-Projet-PsyFlow\memory\video-consultation.md` :

```
## Test pré-appel + Fallback audio adaptatif ✅ DÉPLOYÉ (2026-06-05)
- Pré-appel (patient + invité) : VU-mètre Web Audio, sélection micro/cam/HP, test son, sonde bande passante (asset public/bandwidth-probe.bin 800KB, seuils 1.5/0.5 Mbps). Jamais bloquant.
- Modules : lib/video/bandwidth.ts (pur, testé), hook use-precall-check.ts, composant precall-checklist.tsx
- Périphériques portés jusqu'à la salle via props micId/camId/speakerId sur PatientVideoRoom
- Fallback audio (psy + patient) : hook use-adaptive-quality.ts (anti-flapping 6s Poor → coupe vidéo, reason auto/manual, respect coupure manuelle), composant connection-banner.tsx
- Aucun backend, aucune migration. Déployé Vercel.
```

---

## Self-Review

- **Couverture spec :** Section 1 (pré-appel) → Tasks 1-7. Section 2 (fallback) → Tasks 8-11. Section 3 (tests/fichiers/non-régression/déploiement) → tests dans Tasks 1 & 8, déploiement Task 12. ✅
- **Placeholders :** aucun — chaque step contient code/commande complets. ✅
- **Cohérence des types :** `PrecallSelected` (micId/camId/speakerId) cohérent entre hook, WaitingRoom, pages et props `PatientVideoRoom`. `UseAdaptiveQualityReturn` (degraded/reason/connectionPoor/forceAudioOnly/restoreVideo) cohérent entre hook, banner et intégrations. `BandwidthResult` (mbps/quality/status) cohérent module ↔ hook ↔ UI. ✅
