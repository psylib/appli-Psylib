'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarCheck, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { PatientRowSkeleton } from '@/components/ui/skeleton';
import { ExportButton } from '@/components/shared/export-button';
import { useSessions } from '@/hooks/use-dashboard';
import { formatDateTime } from '@/lib/utils';

export function SessionsPageContent() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useSessions({ page });

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Séances</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data ? `${data.total} séances` : '…'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            path="/sessions/export"
            filename={`seances-${new Date().toISOString().split('T')[0]}.csv`}
            label="Exporter CSV"
          />
          <Button onClick={() => router.push('/dashboard/sessions/new')}>
            <Plus size={16} />
            Nouvelle séance
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white overflow-hidden shadow-sm">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <PatientRowSkeleton key={i} />)
        ) : isError ? (
          <div className="p-8 text-center text-sm text-destructive">Erreur de chargement</div>
        ) : !data?.data.length ? (
          <EmptyState
            icon={CalendarCheck}
            title="Aucune séance"
            description="Commencez par créer votre première séance"
            action={{ label: 'Créer une séance', onClick: () => router.push('/dashboard/sessions/new') }}
          />
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
