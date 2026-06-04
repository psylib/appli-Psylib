'use client';

import { Mic2, MicOff, Loader2 } from 'lucide-react';
import type { ScribeRecorderState } from '@/hooks/use-scribe-recorder';

interface ScribeToggleProps {
  isEnabled: boolean;
  patientConsented: boolean;
  recorderState: ScribeRecorderState;
  isPro: boolean;
  onToggle: () => void;
}

const baseBtn = 'rounded-full p-3 transition-colors text-white';

export function ScribeToggle({
  isEnabled,
  patientConsented,
  recorderState,
  isPro,
  onToggle,
}: ScribeToggleProps) {
  if (!isPro) {
    return (
      <button
        disabled
        className={`${baseBtn} bg-white/5 cursor-not-allowed opacity-50`}
        title="Scribe IA — disponible avec le plan Pro"
      >
        <Mic2 className="h-5 w-5" />
      </button>
    );
  }

  if (!patientConsented) {
    return (
      <button
        disabled
        className={`${baseBtn} bg-white/5 cursor-not-allowed opacity-50`}
        title="Le patient n'a pas encore accepté la transcription IA"
      >
        <MicOff className="h-5 w-5" />
      </button>
    );
  }

  if (recorderState === 'uploading') {
    return (
      <button disabled className={`${baseBtn} bg-white/5 cursor-not-allowed opacity-50`} title="Upload en cours...">
        <Loader2 className="h-5 w-5 animate-spin" />
      </button>
    );
  }

  return (
    <button
      onClick={onToggle}
      className={isEnabled ? `${baseBtn} bg-[#0D9488] hover:bg-[#0b7d72]` : `${baseBtn} bg-white/10 hover:bg-white/20`}
      title={isEnabled ? 'Scribe IA actif — cliquer pour désactiver' : 'Activer le Scribe IA'}
    >
      {isEnabled ? <Mic2 className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
    </button>
  );
}
