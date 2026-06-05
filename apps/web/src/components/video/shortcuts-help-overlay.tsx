'use client';

import { X } from 'lucide-react';

const SHORTCUTS: { key: string; label: string }[] = [
  { key: 'M', label: 'Couper / activer le micro' },
  { key: 'V', label: 'Couper / activer la caméra' },
  { key: 'F', label: 'Plein écran' },
  { key: 'C', label: 'Ouvrir le chat' },
  { key: '?', label: 'Afficher cette aide' },
];

interface Props {
  onClose: () => void;
}

export function ShortcutsHelpOverlay({ onClose }: Props) {
  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-80 rounded-2xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">Raccourcis clavier</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:bg-muted"
            title="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <ul className="space-y-2">
          {SHORTCUTS.map((s) => (
            <li key={s.key} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{s.label}</span>
              <kbd className="rounded border border-border bg-muted px-2 py-0.5 font-mono text-xs font-semibold text-foreground">
                {s.key}
              </kbd>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
