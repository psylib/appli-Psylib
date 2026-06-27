'use client';

import Link from 'next/link';
import { Sparkles, Video, X, Zap } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { useAnalytics } from '@/hooks/use-analytics';
import { billingApi } from '@/lib/api/billing';

/**
 * Nudge contextuel Solo → Pro.
 *
 * N'apparaît QUE pour un psy au plan Solo qui approche (≥ 70 %) ou atteint son
 * plafond de résumés IA du mois — moment où la valeur de Pro (IA + visio
 * illimitées) est la plus évidente. Dismiss mémorisé par mois : le nudge
 * réapparaît au cycle suivant si la limite est de nouveau sous tension.
 *
 * Volontairement silencieux le reste du temps (pas de bandeau permanent qui use).
 */

const NUDGE_THRESHOLD = 0.7; // 70 % du quota IA consommé

function currentMonthKey(): string {
  // Évite Date.now() côté SSR : rendu client only ('use client' + pas de SSR ici)
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function SoloUpgradeNudge({ plan }: { plan: string }) {
  const { data: session } = useSession();
  const { track } = useAnalytics();
  const monthKey = currentMonthKey();
  const dismissKey = `solo-nudge-dismissed-${monthKey}`;

  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(dismissKey) === '1';
  });

  const { data: usage } = useQuery({
    queryKey: ['billing-usage'],
    queryFn: () => billingApi.getUsage(session?.accessToken ?? ''),
    enabled: plan === 'solo' && !!session?.accessToken && !dismissed,
    staleTime: 60_000,
  });

  // Garde-fous : seulement Solo, quota IA fini et sous tension
  if (plan !== 'solo' || dismissed || !usage) return null;
  const { used, limit } = usage.ai;
  if (!limit || limit < 0) return null; // -1 = illimité (ne devrait pas arriver en Solo)
  if (used / limit < NUDGE_THRESHOLD) return null;

  const reached = used >= limit;
  const remaining = Math.max(0, limit - used);

  const handleDismiss = () => {
    if (typeof window !== 'undefined') window.localStorage.setItem(dismissKey, '1');
    setDismissed(true);
  };

  return (
    <div
      className={cn(
        'rounded-xl border p-4 flex items-center gap-4',
        reached ? 'bg-accent/10 border-accent/30' : 'bg-primary/5 border-primary/20',
      )}
      role="status"
    >
      <div
        className={cn(
          'p-2 rounded-lg flex-shrink-0',
          reached ? 'bg-accent/15' : 'bg-primary/10',
        )}
      >
        <Sparkles size={18} className={reached ? 'text-accent' : 'text-primary'} aria-hidden />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">
          {reached
            ? 'Vous avez utilisé vos 10 résumés IA du mois'
            : remaining === 1
            ? 'Plus qu’un résumé IA ce mois-ci'
            : `Plus que ${remaining} résumés IA ce mois-ci`}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
          <span className="inline-flex items-center gap-1">
            <Zap size={11} aria-hidden /> IA illimitée
          </span>
          <span className="inline-flex items-center gap-1">
            <Video size={11} aria-hidden /> Visio illimitée
          </span>
          <span>avec le plan Pro — 40€/mois</span>
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          href="/dashboard/settings/billing"
          onClick={() =>
            track('upgrade_clicked', {
              source: 'solo_ai_cap_nudge',
              ai_used: used,
              ai_limit: limit,
              cap_reached: reached,
            })
          }
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary hover:bg-primary/90 text-white transition-colors"
        >
          <Zap size={12} aria-hidden />
          Passer au Pro
        </Link>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-md hover:bg-black/10 transition-colors text-muted-foreground"
          aria-label="Masquer ce mois-ci"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
