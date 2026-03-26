'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useAnalytics } from '@/hooks/use-analytics';
import { formatDateShort, formatDateTime } from '@/lib/utils';
import {
  Users,
  CalendarCheck,
  TrendingUp,
  Smartphone,
  Clock,
  Check,
  Copy,
  Plus,
  UserPlus,
  Activity,
  MessageSquare,
} from 'lucide-react';
import { KpiCard } from '@/components/shared/kpi-card';
import { KpiCardSkeleton } from '@/components/ui/skeleton';
import { ActivationChecklist } from '@/components/dashboard/activation-checklist';
import { TrialBanner } from '@/components/dashboard/trial-banner';
import { ClinicalAlerts } from '@/components/dashboard/clinical-alerts';
import {
  useDashboardKpis,
  useUpcomingAppointments,
  useRecentSessions,
  usePsychologistProfile,
} from '@/hooks/use-dashboard';
import { formatCurrency, formatTrend, cn } from '@/lib/utils';

interface DashboardContentProps {
  userName: string;
}

// ---------------------------------------------------------------------------
// Badge helpers
// ---------------------------------------------------------------------------

function AppointmentStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    scheduled: { label: 'Planifié', className: 'bg-blue-50 text-blue-700 border-blue-200' },
    confirmed: { label: 'Confirmé', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    cancelled: { label: 'Annulé', className: 'bg-red-50 text-red-700 border-red-200' },
    completed: { label: 'Terminé', className: 'bg-slate-50 text-slate-600 border-slate-200' },
    no_show: { label: 'Absent', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  };
  const cfg = config[status] ?? { label: status, className: 'bg-surface text-muted-foreground border-border' };
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        cfg.className,
      )}
    >
      {cfg.label}
    </span>
  );
}

function PaymentStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    paid: { label: 'Payé', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    pending: { label: 'En attente', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    free: { label: 'Gratuit', className: 'bg-slate-50 text-slate-600 border-slate-200' },
  };
  const cfg = config[status] ?? { label: status, className: 'bg-surface text-muted-foreground border-border' };
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        cfg.className,
      )}
    >
      {cfg.label}
    </span>
  );
}

function SessionTypeBadge({ type }: { type: string }) {
  const labels: Record<string, string> = {
    individual: 'Individuel',
    group: 'Groupe',
    online: 'En ligne',
  };
  return (
    <span className="text-xs text-muted-foreground">{labels[type] ?? type}</span>
  );
}

// ---------------------------------------------------------------------------
// Row skeletons
// ---------------------------------------------------------------------------

function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-0 animate-pulse">
      <div className="h-9 w-9 rounded-full bg-surface flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 bg-surface rounded w-32" />
        <div className="h-3 bg-surface rounded w-24" />
      </div>
      <div className="h-5 bg-surface rounded-full w-16" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

function formatDateFr(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

const formatDateShortFr = (iso: string) => formatDateShort(iso);

function todayFr(): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}

function greet(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bonjour';
  if (hour < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

// ---------------------------------------------------------------------------
// Quick Actions config
// ---------------------------------------------------------------------------

const QUICK_ACTIONS = [
  {
    label: 'Nouvelle séance',
    href: '/dashboard/sessions/new',
    icon: Plus,
    bgClass: 'bg-primary/10 group-hover:bg-primary/15',
    iconClass: 'text-primary',
    borderClass: 'border-primary/20 hover:border-primary/40',
  },
  {
    label: 'Nouveau patient',
    href: '/dashboard/patients/new',
    icon: UserPlus,
    bgClass: 'bg-emerald-50 group-hover:bg-emerald-100',
    iconClass: 'text-emerald-600',
    borderClass: 'border-emerald-200 hover:border-emerald-300',
  },
  {
    label: 'Lancer une évaluation',
    href: '/dashboard/outcomes',
    icon: Activity,
    bgClass: 'bg-violet-50 group-hover:bg-violet-100',
    iconClass: 'text-violet-600',
    borderClass: 'border-violet-200 hover:border-violet-300',
  },
  {
    label: 'Voir les messages',
    href: '/dashboard/messages',
    icon: MessageSquare,
    bgClass: 'bg-amber-50 group-hover:bg-amber-100',
    iconClass: 'text-amber-600',
    borderClass: 'border-amber-200 hover:border-amber-300',
  },
] as const;

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function DashboardContent({ userName }: DashboardContentProps) {
  const { data: kpis, isLoading: kpisLoading, isError } = useDashboardKpis();
  const { data: upcomingRaw, isLoading: appointmentsLoading } = useUpcomingAppointments(5);
  const { data: recentRaw, isLoading: sessionsLoading } = useRecentSessions(5);
  const { data: profile } = usePsychologistProfile();
  const { data: session } = useSession();
  const { track, identify } = useAnalytics();

  const [profileLinkCopied, setProfileLinkCopied] = useState(false);

  // Identify psy in PostHog once KPIs are available
  useEffect(() => {
    if (!kpis || !session?.user?.id) return;
    identify(session.user.id, {
      plan: kpis.subscription?.plan ?? 'free',
      subscription_status: kpis.subscription?.status ?? 'none',
    });
  }, [kpis, session?.user?.id, identify]);

  const upcoming = Array.isArray(upcomingRaw) ? upcomingRaw : [];
  const recentSessions = recentRaw?.data ?? [];

  const handleCopyProfileLink = async () => {
    const slug = profile?.slug;
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://psylib.eu';
    const link = slug ? `${baseUrl}/psy/${slug}` : baseUrl;
    await navigator.clipboard.writeText(link);
    track('profile_link_copied');
    setProfileLinkCopied(true);
    setTimeout(() => setProfileLinkCopied(false), 2000);
  };

  const firstName = userName.split(' ')[0] ?? '';

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* ----------------------------------------------------------------- */}
      {/* Header                                                            */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {greet()}{firstName ? `, ${firstName}` : ''}{' '}
            <span aria-hidden="true">👋</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1 capitalize">{todayFr()}</p>
        </div>

        <button
          onClick={() => void handleCopyProfileLink()}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors self-start',
            profileLinkCopied
              ? 'border-accent/40 bg-accent/10 text-accent'
              : 'border-border hover:border-primary/30 hover:bg-surface text-foreground',
          )}
          title="Copier le lien vers votre profil public de matching"
        >
          {profileLinkCopied ? (
            <>
              <Check size={15} className="text-accent" aria-hidden />
              Lien copié !
            </>
          ) : (
            <>
              <Copy size={15} aria-hidden />
              Partager mon profil
            </>
          )}
        </button>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Trial / billing banner                                           */}
      {/* ----------------------------------------------------------------- */}
      {kpis?.subscription && (
        <TrialBanner
          status={kpis.subscription.status}
          plan={kpis.subscription.plan}
          trialDaysLeft={kpis.subscription.trialDaysLeft}
        />
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Activation Checklist (disparaît à 5/5 ou si dismissed)          */}
      {/* ----------------------------------------------------------------- */}
      <ActivationChecklist />

      {/* ----------------------------------------------------------------- */}
      {/* Row 1 — 4 KPI Cards                                              */}
      {/* ----------------------------------------------------------------- */}
      <section aria-label="Statistiques clés">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
          Vue d&apos;ensemble
        </h2>

        {isError && (
          <div
            className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive mb-4"
            role="alert"
          >
            Impossible de charger les statistiques. Vérifiez que l&apos;API est démarrée.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {kpisLoading ? (
            Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)
          ) : (
            <>
              {/* Patients actifs */}
              <KpiCard
                label="Patients actifs"
                value={kpis?.patients.active ?? '—'}
                trend={kpis?.patients.trend}
                trendLabel={
                  kpis
                    ? `+${kpis.patients.newThisMonth} ce mois`
                    : undefined
                }
                icon={Users}
                color="accent"
              />

              {/* Séances ce mois */}
              <KpiCard
                label="Séances ce mois"
                value={kpis?.sessions.totalThisMonth ?? '—'}
                trend={kpis?.sessions.trend}
                icon={CalendarCheck}
                color="primary"
              />

              {/* Revenus ce mois */}
              <KpiCard
                label="Revenus ce mois"
                value={kpis ? formatCurrency(kpis.revenue.thisMonth) : '—'}
                trend={kpis?.revenue.trend}
                trendLabel={
                  kpis
                    ? `${formatTrend(kpis.revenue.trend)} vs mois dernier`
                    : undefined
                }
                icon={TrendingUp}
                color="warm"
              />

              {/* RDV aujourd'hui / portail */}
              <KpiCard
                label="RDV aujourd'hui"
                value={kpis?.appointments.today ?? '—'}
                trendLabel={`${kpis?.appointments.upcoming ?? 0} RDV à venir`}
                icon={Smartphone}
              />
            </>
          )}
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Row 2 — Prochains RDV + Dernières séances                        */}
      {/* ----------------------------------------------------------------- */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prochains RDV */}
        <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock size={16} className="text-primary" aria-hidden />
              Prochains RDV
            </h2>
            <Link
              href="/dashboard/calendar"
              className="text-xs text-primary hover:underline"
            >
              Voir le calendrier →
            </Link>
          </div>

          {appointmentsLoading ? (
            <div>
              {Array.from({ length: 3 }).map((_, i) => (
                <RowSkeleton key={i} />
              ))}
            </div>
          ) : upcoming.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CalendarCheck size={32} className="text-muted-foreground opacity-30 mb-2" aria-hidden />
              <p className="text-sm text-muted-foreground">Aucun RDV à venir</p>
              <Link
                href="/dashboard/calendar"
                className="text-xs text-primary hover:underline mt-1"
              >
                Planifier un RDV
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {upcoming.slice(0, 5).map((appt) => (
                <li key={appt.id} className="py-3 flex items-center gap-3">
                  {/* Avatar initial */}
                  <div
                    className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0"
                    aria-hidden
                  >
                    {appt.patient.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {appt.patient.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateFr(appt.scheduledAt)} · {appt.duration} min
                    </p>
                  </div>
                  <AppointmentStatusBadge status={appt.status} />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Dernières séances */}
        <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <CalendarCheck size={16} className="text-accent" aria-hidden />
              Dernières séances
            </h2>
            <Link
              href="/dashboard/sessions"
              className="text-xs text-primary hover:underline"
            >
              Voir toutes →
            </Link>
          </div>

          {sessionsLoading ? (
            <div>
              {Array.from({ length: 3 }).map((_, i) => (
                <RowSkeleton key={i} />
              ))}
            </div>
          ) : recentSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users size={32} className="text-muted-foreground opacity-30 mb-2" aria-hidden />
              <p className="text-sm text-muted-foreground">Aucune séance enregistrée</p>
              <Link
                href="/dashboard/sessions/new"
                className="text-xs text-primary hover:underline mt-1"
              >
                Créer une séance
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {recentSessions.slice(0, 5).map((sess) => (
                <li key={sess.id} className="py-3 flex items-center gap-3">
                  {/* Avatar initial */}
                  <div
                    className="h-9 w-9 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-bold flex-shrink-0"
                    aria-hidden
                  >
                    {sess.patient.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {sess.patient.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-muted-foreground">
                        {formatDateShortFr(sess.date)}
                      </p>
                      <span className="text-muted-foreground text-xs" aria-hidden>·</span>
                      <SessionTypeBadge type={sess.type} />
                    </div>
                  </div>
                  <PaymentStatusBadge status={sess.paymentStatus} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Row 3 — Clinical Alerts                                          */}
      {/* ----------------------------------------------------------------- */}
      <ClinicalAlerts />

      {/* ----------------------------------------------------------------- */}
      {/* Row 4 — Quick Actions                                            */}
      {/* ----------------------------------------------------------------- */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
          Actions rapides
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className={cn(
                  'group rounded-xl border p-4 flex items-center gap-3 transition-all hover:shadow-sm',
                  action.borderClass,
                )}
              >
                <div
                  className={cn(
                    'p-2 rounded-lg transition-colors flex-shrink-0',
                    action.bgClass,
                  )}
                >
                  <Icon size={18} className={action.iconClass} aria-hidden />
                </div>
                <span className="text-sm font-medium text-foreground leading-tight">
                  {action.label}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

    </div>
  );
}
