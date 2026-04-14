'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Users, Search, Plus, Mail, CheckCircle2, Clock, MoreVertical, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PatientAvatar } from '@/components/shared/patient-avatar';
import { EmptyState } from '@/components/shared/empty-state';
import { PatientRowSkeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { CreatePatientDialog } from './create-patient-dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { ExportButton } from '@/components/shared/export-button';
import { usePatients } from '@/hooks/use-dashboard';
import { patientsApi } from '@/lib/api/patients';
import { formatDate } from '@/lib/utils';
import type { PatientStatus } from '@psyscale/shared-types';

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'success' | 'secondary' | 'warning' | 'destructive' | 'outline' }> = {
  active: { label: 'Actif', variant: 'success' },
  inactive: { label: 'Inactif', variant: 'secondary' },
  archived: { label: 'Archivé', variant: 'outline' },
};

function PortalBadge({ status }: { status: 'none' | 'pending' | 'active' }) {
  if (status === 'none') return null;
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-amber-600" title="Invitation en attente">
        <Clock size={13} aria-hidden />
        <span className="hidden sm:inline">En attente</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-accent" title="Portail actif">
      <CheckCircle2 size={13} aria-hidden />
      <span className="hidden sm:inline">Portail</span>
    </span>
  );
}

export function PatientsPageContent() {
  const router = useRouter();
  const { data: session } = useSession();
  const { success, error: showError } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PatientStatus | ''>('');
  const [showCreate, setShowCreate] = useState(false);
  const [page, setPage] = useState(1);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [inviting, setInviting] = useState<string | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<{ id: string; name: string } | null>(null);
  const [archiving, setArchiving] = useState(false);

  const { data, isLoading, isError, refetch } = usePatients({
    search: search || undefined,
    status: statusFilter || undefined,
    page,
  });

  const handleArchive = async () => {
    if (!archiveTarget) return;
    setArchiving(true);
    try {
      await patientsApi.archive(archiveTarget.id, session?.accessToken ?? '');
      success(`${archiveTarget.name} archivé(e)`);
      setArchiveTarget(null);
      void refetch();
    } catch {
      showError("Impossible d'archiver ce patient");
    } finally {
      setArchiving(false);
    }
  };

  const handleInvite = async (patientId: string, patientName: string) => {
    setInviting(patientId);
    setOpenMenu(null);
    try {
      await patientsApi.invite(patientId, session?.accessToken ?? '');
      success(`Invitation envoyée à ${patientName}`);
      void refetch();
    } catch {
      showError("L'invitation n'a pas pu être envoyée");
    } finally {
      setInviting(null);
    }
  };

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
      <div className="rounded-xl border border-border bg-white shadow-sm">
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
              const canInvite = !!patient.email && patient.portalStatus === 'none';
              const isNearBottom = i >= data.data.length - 2;
              return (
                <li key={patient.id} className={i < data.data.length - 1 ? 'border-b border-border' : ''}>
                  <div className="flex items-center gap-4 p-4 hover:bg-surface transition-colors">
                    <button
                      onClick={() => router.push(`/dashboard/patients/${patient.id}`)}
                      className="flex items-center gap-4 flex-1 min-w-0 text-left"
                    >
                      <PatientAvatar name={patient.name} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">{patient.name}</p>
                          <PortalBadge status={patient.portalStatus ?? 'none'} />
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {patient.email ?? 'Pas d\'email'} •{' '}
                          {patient.createdAt ? `Depuis ${formatDate(patient.createdAt)}` : ''}
                        </p>
                      </div>
                      {status && (
                        <Badge variant={status.variant}>{status.label}</Badge>
                      )}
                    </button>

                    {/* Actions menu */}
                    <div className="relative flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === patient.id ? null : patient.id); }}
                        className="p-2 rounded-lg text-muted-foreground hover:bg-border/50 transition-colors"
                        aria-label="Actions"
                      >
                        <MoreVertical size={16} aria-hidden />
                      </button>
                      {openMenu === patient.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                          <div className={`absolute right-0 z-20 w-52 rounded-lg border border-border bg-white shadow-lg py-1 ${isNearBottom ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
                            <button
                              onClick={() => { setOpenMenu(null); router.push(`/dashboard/patients/${patient.id}`); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-surface transition-colors"
                            >
                              Voir la fiche
                            </button>
                            {canInvite && (
                              <button
                                onClick={() => handleInvite(patient.id, patient.name)}
                                disabled={inviting === patient.id}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-surface transition-colors disabled:opacity-50"
                              >
                                <Send size={14} className="text-primary" aria-hidden />
                                {inviting === patient.id ? 'Envoi...' : 'Inviter au portail'}
                              </button>
                            )}
                            {patient.portalStatus === 'pending' && (
                              <button
                                onClick={() => handleInvite(patient.id, patient.name)}
                                disabled={inviting === patient.id}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-surface transition-colors disabled:opacity-50"
                              >
                                <Mail size={14} className="text-amber-600" aria-hidden />
                                {inviting === patient.id ? 'Envoi...' : 'Renvoyer l\'invitation'}
                              </button>
                            )}
                            <div className="border-t border-border my-1" />
                            <button
                              onClick={() => { setOpenMenu(null); setArchiveTarget({ id: patient.id, name: patient.name }); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={14} aria-hidden />
                              Archiver
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Pagination — à l'intérieur de la card */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
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
      </div>

      {/* Modal création */}
      <CreatePatientDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => { setShowCreate(false); void refetch(); }}
      />

      {/* Confirmation archivage */}
      <ConfirmDialog
        open={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={handleArchive}
        title="Archiver ce patient ?"
        description={
          archiveTarget
            ? `${archiveTarget.name} sera archivé(e). Vous pourrez toujours consulter son dossier mais il n'apparaîtra plus dans la liste active.`
            : ''
        }
        confirmLabel="Archiver"
        variant="destructive"
        loading={archiving}
      />
    </div>
  );
}
