'use client';

import { useState, useRef, useEffect } from 'react';
import { useMediaDeviceSelect } from '@livekit/components-react';
import { Settings, Camera, Mic, Volume2, Sparkles, Check, Loader2 } from 'lucide-react';

interface DeviceSettingsMenuProps {
  blurEnabled: boolean;
  blurPending: boolean;
  onToggleBlur: () => void;
}

function DeviceList({
  kind,
  icon,
  label,
}: {
  kind: MediaDeviceKind;
  icon: React.ReactNode;
  label: string;
}) {
  const { devices, activeDeviceId, setActiveMediaDevice } = useMediaDeviceSelect({ kind });

  if (devices.length === 0) return null;

  return (
    <div className="px-2 py-2">
      <div className="flex items-center gap-2 px-2 pb-1 text-xs font-medium text-white/50">
        {icon}
        {label}
      </div>
      {devices.map((d) => {
        const isActive = d.deviceId === activeDeviceId;
        return (
          <button
            key={d.deviceId}
            onClick={() => setActiveMediaDevice(d.deviceId)}
            className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
              isActive ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10'
            }`}
          >
            <span className="flex h-4 w-4 shrink-0 items-center justify-center">
              {isActive && <Check className="h-4 w-4" />}
            </span>
            <span className="truncate">{d.label || 'Périphérique sans nom'}</span>
          </button>
        );
      })}
    </div>
  );
}

export function DeviceSettingsMenu({ blurEnabled, blurPending, onToggleBlur }: DeviceSettingsMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`rounded-full p-3 transition-colors ${open ? 'bg-white/25 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
        title="Réglages audio / vidéo"
      >
        <Settings className="h-5 w-5" />
      </button>

      {open && (
        <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-72 max-h-[60vh] overflow-y-auto rounded-xl border border-white/10 bg-gray-900/95 backdrop-blur shadow-2xl">
          <DeviceList kind="videoinput" icon={<Camera className="h-3.5 w-3.5" />} label="Caméra" />
          <div className="mx-2 border-t border-white/10" />
          <DeviceList kind="audioinput" icon={<Mic className="h-3.5 w-3.5" />} label="Microphone" />
          <div className="mx-2 border-t border-white/10" />
          <DeviceList kind="audiooutput" icon={<Volume2 className="h-3.5 w-3.5" />} label="Haut-parleur" />
          <div className="mx-2 border-t border-white/10" />

          <div className="px-2 py-2">
            <button
              onClick={onToggleBlur}
              disabled={blurPending}
              className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm text-white/90 transition-colors hover:bg-white/10 disabled:opacity-60"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Flou d&apos;arrière-plan
              </span>
              {blurPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span
                  className={`relative h-5 w-9 rounded-full transition-colors ${blurEnabled ? 'bg-[#0D9488]' : 'bg-white/20'}`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${blurEnabled ? 'left-4' : 'left-0.5'}`}
                  />
                </span>
              )}
            </button>
            <p className="px-2 pt-1 text-[11px] leading-tight text-white/40">
              Masque votre cabinet / domicile pour préserver la confidentialité.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
