'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Phone, Mail, Calendar, Plus, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PatientAvatar } from '@/components/shared/patient-avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ExportButton } from '@/components/shared/export-button';
import { EditPatientDialog } from './edit-patient-dialog';
import { usePatient, useSessions } from '@/hooks/use-dashboard';
import { formatDate } from '@/lib/utils';
import { PatientPortalSection } from './patient-portal-section';

interface PatientDetailContentProps {
  patientId: string;
}

export function PatientDetailContent({ patientId }: PatientDetailContentProps) {
  const router = useRouter();
  const { data: patient, isLoading } = usePatient(patientId);
  const { data: sessions } = useSessions({ patientId });
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <div className="rounded-xl border border-border bg-white p-6 space-y-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Patient introuvable</p>
        <Button variant="link" onClick={() => router.back()}>Retour</Button>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Retour">
            <ArrowLeft size={18} />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Fiche patient</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil size={14} />
            Modifier
          </Button>
          <ExportButton
            path={`/patients/${patientId}/export`}
            filename={`patient-rgpd-${patientId.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.json`}
            label="Export RGPD"
          />
        </div>
      </div>

      {/* Patient card */}
      <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="p-6 flex items-start gap-5 border-b border-border">
          <PatientAvatar name={patient.name} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-foreground">{patient.name}</h2>
              <Badge variant={patient.status === 'active' ? 'success' : 'secondary'}>
                {patient.status === 'active' ? 'Actif' : patient.status === 'inactive' ? 'Inactif' : 'Archivé'}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
              {patient.email && (
                <span className="flex items-center gap-1.5">
                  <Mail size={14} aria-hidden />
                  {patient.email}
                </span>
              )}
              {patient.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone size={14} aria-hidden />
                  {patient.phone}
                </span>
              )}
              {patient.birthDate && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} aria-hidden />
                  {formatDate(patient.birthDate)}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Patient depuis {formatDate(patient.createdAt)}
            </p>
          </div>
        </div>

        {/* Notes cliniques */}
        {patient.notes && (
          <div className="p-6 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground mb-2">Notes cliniques</h3>
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {patient.notes}
            </p>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              🔒 Données chiffrées (HDS conforme)
            </p>
          </div>
        )}
      </div>

      {/* Portal patient */}
      <PatientPortalSection patientId={patientId} />

      {/* Séances récentes */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground">
            Séances
            {sessions?.total !== undefined && (
              <span className="ml-2 text-sm text-muted-foreground font-normal">
                ({sessions.total})
              </span>
            )}
          </h3>
          <Button
            size="sm"
            onClick={() => router.push(`/dashboard/sessions/new?patientId=${patientId}`)}
          >
            <Plus size={14} />
            Nouvelle séance
          </Button>
        </div>

        {!sessions?.data.length ? (
          <div className="rounded-xl border border-border bg-white p-8 text-center">
            <p className="text-sm text-muted-foreground">Aucune séance enregistrée</p>
          </div>
        ) : (
          <ul className="rounded-xl border border-border bg-white overflow-hidden shadow-sm divide-y divide-border">
            {sessions.data.map((session) => (
              <li key={session.id}>
                <button
                  onClick={() => router.push(`/dashboard/sessions/${session.id}`)}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-surface transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {formatDate(session.date)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {session.duration} min • {session.type === 'individual' ? 'Individuel' : session.type === 'online' ? 'En ligne' : 'Groupe'}
                    </p>
                  </div>
                  <div className="text-right">
                    {session.rate && (
                      <p className="text-sm font-medium text-foreground">{Number(session.rate)}€</p>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {patient && (
        <EditPatientDialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          patient={patient}
        />
      )}
    </div>
  );
}
