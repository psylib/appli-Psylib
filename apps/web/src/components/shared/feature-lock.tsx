'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { Lock, Zap, Check } from 'lucide-react';
import { useSubscription } from '@/hooks/use-subscription';
import { useAnalytics } from '@/hooks/use-analytics';
import { KpiCardSkeleton } from '@/components/ui/skeleton';

// ─── Config par plan ──────────────────────────────────────────────────────────

const PLAN_CONFIG = {
  pro: {
    badge: 'Pro',
    price: '50€/mois',
    highlights: [
      'Patients et séances illimités',
      'IA illimitée',
      'Analytics avancées',
      'Portail patient sécurisé',
    ],
  },
  clinic: {
    badge: 'Clinic',
    price: '79€/mois',
    highlights: [
      'Tout le plan Pro inclus',
      'Créer et vendre des formations en ligne',
      'Gestion multi-praticiens',
      'Support dédié',
    ],
  },
} as const;

// ─── Props ────────────────────────────────────────────────────────────────────

interface FeatureLockProps {
  requiredPlan: 'pro' | 'clinic';
  featureName: string;
  featureDescription: string;
  icon: LucideIcon;
  children: ReactNode;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function FeatureLock({
  requiredPlan,
  featureName,
  featureDescription,
  icon: Icon,
  children,
}: FeatureLockProps) {
  const { canAccess, isLoading } = useSubscription();
  const { track } = useAnalytics();

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <KpiCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!canAccess(requiredPlan)) {
    const config = PLAN_CONFIG[requiredPlan];
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] p-6">
        <div className="max-w-sm w-full text-center">
          {/* Icône feature */}
          <div className="mx-auto mb-5 h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Icon size={38} className="text-primary" aria-hidden />
          </div>

          {/* Badge plan */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-4">
            <Lock size={11} aria-hidden />
            Fonctionnalité {config.badge}
          </span>

          <h1 className="text-xl font-bold text-foreground mb-2">{featureName}</h1>
          <p className="text-sm text-muted-foreground mb-6">{featureDescription}</p>

          {/* Ce que le plan débloque */}
          <ul className="text-left space-y-2.5 mb-8 bg-surface rounded-xl p-4 border border-border">
            {config.highlights.map((h) => (
              <li key={h} className="flex items-center gap-2.5 text-sm text-foreground">
                <Check size={14} className="text-primary flex-shrink-0" aria-hidden />
                {h}
              </li>
            ))}
          </ul>

          {/* CTA */}
          <Link
            href="/dashboard/settings/billing"
            onClick={() =>
              track('upgrade_clicked', {
                source: 'feature_lock',
                feature: featureName,
                required_plan: requiredPlan,
              })
            }
            className="flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white px-6 py-3 text-sm font-semibold transition-colors w-full"
          >
            <Zap size={15} aria-hidden />
            Passer au {config.badge} — {config.price}
          </Link>

          <p className="text-xs text-muted-foreground mt-3">
            14 jours d&apos;essai gratuit · Résiliation à tout moment
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
