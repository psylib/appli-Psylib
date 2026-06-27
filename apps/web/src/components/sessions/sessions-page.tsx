'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarCheck, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { PatientRowSkeleton } from '@/components/ui/skeleton';
import { ExportButton } from '@/components/shared/export-button';
import { useSessions, usePatients } from '@/hooks/use-dashboard';
import { formatDateTime } from '@/lib/utils';
import { useUIStore } from '@/store/ui.store';

export function SessionsPageContent() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [patientId, setPatientId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const hasFilters = !!(patientId || from || to);

  const { data, isLoading, isError, refetch } = useSessions({
    page,
    patientId: patientId || undefined,
    from: from || undefined,
    // inclut toute la journée « jusqu'au »
    to: to ? `${to}T23:59:59` : undefined,
  });
  // Liste des patients pour le filtre (cabinets jusqu'à ~100 patients)
  const { data: patientsData } = usePatients({ limit: 100 });
  const openSlotPicker = useUIStore((s) => s.openSmartSlotPicker);

  // Tout changement de filtre revient à la page 1
  const onFilter = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  const resetFilters = () => {
    setPatientId('');
    setFrom('');
    setTo('');
    setPage(1);
  };

  const controlClass =
    'h-9 rounded-lg border border-input bg-white px-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1';

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Séances</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data ? `${data.total} séance${data.total > 1 ? 's' : ''}${hasFilters ? ' (filtrées)' : ''}` : '…'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            path="/sessions/export"
            filename={`seances-${new Date().toISOString().split('T')[0]}.csv`}
            label="Exporter CSV"
          />
          <Button onClick={() => openSlotPicker()}>
            <Plus size={16} />
            Nouvelle séance
          </Button>
        </div>
      </div>

      {/* Barre de filtres — retrouver les séances d'un patient / d'une période */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-patient" className="text-xs font-medium text-muted-foreground">
            Patient
          </label>
          <select
            id="filter-patient"
            value={patientId}
            onChange={(e) => onFilter(setPatientId)(e.target.value)}
            className={`${controlClass} min-w-[12rem]`}
          >
            <option value="">Tous les patients</option>
            {patientsData?.data.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="filter-from" className="text-xs font-medium text-muted-foreground">
            Du
          </label>
          <input
            id="filter-from"
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => onFilter(setFrom)(e.target.value)}
            className={controlClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="filter-to" className="text-xs font-medium text-muted-foreground">
            Au
          </label>
          <input
            id="filter-to"
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => onFilter(setTo)(e.target.value)}
            className={controlClass}
          />
        </div>

        {hasFilters && (
          <button
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
          >
            <X size={14} />
            Réinitialiser
          </button>
        )}
      </div>

      <div className="rounded-xl border border-border bg-white overflow-hidden shadow-sm">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <PatientRowSkeleton key={i} />)
        ) : isError ? (
          <div className="p-8 text-center">
            <p className="text-sm text-destructive">Erreur de chargement</p>
            <button onClick={() => refetch()} className="text-sm text-primary hover:underline mt-2">
              Réessayer
            </button>
          </div>
        ) : !data?.data.length ? (
          hasFilters ? (
            <EmptyState
              icon={CalendarCheck}
              title="Aucune séance pour ces filtres"
              description="Aucune séance ne correspond au patient ou à la période sélectionnés."
              action={{ label: 'Réinitialiser les filtres', onClick: resetFilters }}
            />
          ) : (
            <EmptyState
              icon={CalendarCheck}
              title="Aucune séance"
              description="Commencez par créer votre première séance"
              action={{ label: 'Créer une séance', onClick: () => openSlotPicker() }}
            />
          )
        ) : (
          <ul role="list" className="divide-y divide-border">
            {data.data.map((session) => {
              const s = session as typeof session & { patient?: { name: string } };
              return (
                <li key={session.id}>
                  <button
                    onClick={() => router.push(`/dashboard/sessions/${session.id}`)}
                    className="w-full flex items-center gap-4 p-4 text-left hover:bg-surface transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {s.patient?.name ?? 'Patient'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDateTime(session.date)} • {session.duration} min
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      {session.rate && (
                        <p className="text-sm font-medium text-foreground">{Number(session.rate)}€</p>
                      )}
                      <p className={`text-xs ${session.paymentStatus === 'paid' ? 'text-accent' : 'text-muted-foreground'}`}>
                        {session.paymentStatus === 'paid' ? 'Payé' : session.paymentStatus === 'pending' ? 'En attente' : 'Gratuit'}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {/* Pagination — à l'intérieur de la card */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">Page {page} sur {data.totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Précédent</Button>
              <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}>Suivant</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
