'use client';

import { useEffect, useRef } from 'react';

interface UseVideoShortcutsOptions {
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleFullscreen: () => void;
  onToggleChat: () => void;
  onToggleHelp: () => void;
  /** Désactive l'écoute clavier (ex: pendant un modal). Défaut: true. */
  enabled?: boolean;
}

/** Cible un champ éditable où l'on ne doit jamais intercepter les touches. */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  );
}

/**
 * Raccourcis clavier de la salle de visio (côté psy).
 * M = micro · V = caméra · F = plein écran · C = chat · ? = aide
 */
export function useVideoShortcuts({
  onToggleMic,
  onToggleCamera,
  onToggleFullscreen,
  onToggleChat,
  onToggleHelp,
  enabled = true,
}: UseVideoShortcutsOptions) {
  // Garder les handlers à jour sans réenregistrer l'écouteur à chaque rendu.
  const handlersRef = useRef({
    onToggleMic,
    onToggleCamera,
    onToggleFullscreen,
    onToggleChat,
    onToggleHelp,
  });
  handlersRef.current = {
    onToggleMic,
    onToggleCamera,
    onToggleFullscreen,
    onToggleChat,
    onToggleHelp,
  };

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (isEditableTarget(e.target)) return;

      const h = handlersRef.current;
      switch (e.key.toLowerCase()) {
        case 'm':
          e.preventDefault();
          h.onToggleMic();
          break;
        case 'v':
          e.preventDefault();
          h.onToggleCamera();
          break;
        case 'f':
          e.preventDefault();
          h.onToggleFullscreen();
          break;
        case 'c':
          e.preventDefault();
          h.onToggleChat();
          break;
        case '?':
          e.preventDefault();
          h.onToggleHelp();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);
}
