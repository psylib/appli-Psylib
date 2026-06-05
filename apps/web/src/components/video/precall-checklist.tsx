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
