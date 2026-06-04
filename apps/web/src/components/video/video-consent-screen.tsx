'use client';

import { useState } from 'react';
import { Shield, Video } from 'lucide-react';

interface VideoConsentScreenProps {
  psychologistName: string;
  onAccept: (includeScribe: boolean) => void;
  isLoading?: boolean;
}

export function VideoConsentScreen({ psychologistName, onAccept, isLoading }: VideoConsentScreenProps) {
  const [scribeConsent, setScribeConsent] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-white p-8 shadow-sm">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 mx-auto mb-4">
          <Shield className="h-6 w-6 text-accent" />
        </div>
        <h1 className="text-xl font-bold text-center text-foreground mb-2">
          Consultation video
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Avant de rejoindre votre consultation avec <strong>{psychologistName}</strong>,
          veuillez accepter les conditions suivantes :
        </p>
        <div className="rounded-lg bg-muted/50 p-4 text-sm text-foreground mb-6">
          <p>En rejoignant cette consultation video, vous autorisez le traitement
          de votre image et votre voix en temps reel sur une infrastructure
          certifiee HDS en France.</p>
          <p className="mt-2 font-medium">Aucun enregistrement n&apos;est effectue.</p>
        </div>
        <div className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4 mb-4">
          <input
            id="scribe-consent"
            type="checkbox"
            checked={scribeConsent}
            onChange={(e) => setScribeConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[#0D9488]"
          />
          <label htmlFor="scribe-consent" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
            <span className="font-medium text-foreground">Transcription IA (optionnel)</span>
            <br />
            J&apos;accepte que cette séance soit transcrite automatiquement pour aider mon psychologue
            à rédiger sa note clinique. La transcription est chiffrée et n&apos;est pas partagée.
          </label>
        </div>
        <button
          onClick={() => onAccept(scribeConsent)}
          disabled={isLoading}
          className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Video className="h-4 w-4" />
          {isLoading ? 'Enregistrement...' : 'Accepter et continuer'}
        </button>
      </div>
    </div>
  );
}
