'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, X, Rocket, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActivationChecklist } from '@/hooks/use-dashboard';

const DISMISS_KEY = 'psylib_checklist_dismissed';

export function ActivationChecklist() {
  const { data, isLoading } = useActivationChecklist();
  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDismissed(localStorage.getItem(DISMISS_KEY) === '1');
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  // Ne pas afficher si : loading, dismissed, ou 100% complété
  if (isLoading || dismissed || !data) return null;
  if (data.allDone) return null;

  const progress = Math.round((data.completedCount / data.totalCount) * 100);

  return (
    <section
      className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-5 shadow-sm"
      aria-label="Checklist de démarrage"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Rocket size={16} className="text-primary" aria-hidden />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Démarrez avec PsyLib
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {data.completedCount}/{data.totalCount} étapes complétées
            </p>
          </div>
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          aria-expanded={open}
        >
          {open ? 'Réduire' : 'Afficher'}
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-primary/15 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* Steps */}
      {open && (
        <ul className="space-y-2">
          {data.steps.map((step) => (
            <li key={step.id}>
              {step.completed ? (
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/60">
                  <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" aria-hidden />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground/60 line-through">{step.label}</p>
                  </div>
                </div>
              ) : (
                <Link
                  href={step.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white border border-border',
                    'hover:border-primary/30 hover:shadow-sm transition-all group',
                  )}
                >
                  <Circle size={18} className="text-primary/40 flex-shrink-0 group-hover:text-primary/60 transition-colors" aria-hidden />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{step.label}</p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" aria-hidden />
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-3"
        aria-label="Ne plus afficher cette checklist"
      >
        <X size={12} aria-hidden />
        Ne plus afficher
      </button>
    </section>
  );
}
