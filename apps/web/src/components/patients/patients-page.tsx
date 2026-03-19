'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Search, Plus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PatientAvatar } from '@/components/shared/patient-avatar';
import { EmptyState } from '@/components/shared/empty-state';
import { PatientRowSkeleton } from '@/components/ui/skeleton';
import { CreatePatientDialog } from './create-patient-dialog';
import { ExportButton } from '@/components/shared/export-button';
import { usePatients } from '@/hooks/use-dashboard';
import { formatDate } from '@/lib/utils';
import type { PatientStatus } from '@psyscale/shared-types';

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'success' | 'secondary' | 'warning' | 'destructive' | 'outline' }> = {
  active: { label: 'Actif', variant: 'success' },
  inactive: { label: 'Inactif', variant: 'secondary' },
  archived: { label: 'Archivé', variant: 'outline' },
};

export function PatientsPageContent() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PatientStatus | ''>('');
  const [showCreate, setShowCreate] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = usePatients({
    search: search || undefined,
    status: statusFilter || undefined,
    page,
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Patients</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data ? `${data.total} patients` : '…'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            path="/patients/export"
            filename={`patients-${new Date().toISOString().split('T')[0]}.csv`}
            label="Exporter CSV"
          />
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} />
            Nouveau patient
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            type="search"
            placeholder="Rechercher un patient..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="h-11 w-full rounded-lg border border-input bg-white pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Rechercher"
          />
        </div>

        <div className="flex items-center gap-2">
          {['', 'active', 'inactive', 'archived'].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s as PatientStatus | ''); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors min-h-[36px] ${
                statusFilter === s
                  ? 'bg-primary text-white'
                  : 'bg-surface text-muted-foreground hover:bg-border'
              }`}
            >
              {s === '' ? 'Tous' : STATUS_LABELS[s]?.label ?? s}
            </button>
          ))}
        </div>
      </div>

      {/* Liste */}
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
          <EmptyState
            icon={Users}
            title="Aucun patient"
            description={search ? `Aucun résultat pour "${search}"` : 'Commencez par ajouter votre premier patient'}
            action={!search ? { label: 'Ajouter un patient', onClick: () => setShowCreate(true) } : undefined}
          />
        ) : (
          <ul role="list">
            {data.data.map((patient, i) => {
              const status = STATUS_LABELS[patient.status];
              return (
                <li key={patient.id}>
                  <button
                    onClick={() => router.push(`/dashboard/patients/${patient.id}`)}
                    className={`w-full flex items-center gap-4 p-4 text-left hover:bg-surface transition-colors ${
                      i < data.data.length - 1 ? 'border-b border-border' : ''
                    }`}
                  >
                    <PatientAvatar name={patient.name} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{patient.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {patient.email ?? 'Pas d\'email'} •{' '}
                        {patient.createdAt ? `Depuis ${formatDate(patient.createdAt)}` : ''}
                      </p>
                    </div>
                    {status && (
                      <Badge variant={status.variant}>{status.label}</Badge>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} sur {data.totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              Précédent
            </Button>
            <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}>
              Suivant
            </Button>
          </div>
        </div>
      )}

      {/* Modal création */}
      <CreatePatientDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => { setShowCreate(false); void refetch(); }}
      />
    </div>
  );
}
