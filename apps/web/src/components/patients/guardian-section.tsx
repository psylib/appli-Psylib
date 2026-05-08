'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Mail, Phone, Trash2, Send, Pencil } from 'lucide-react';
import { AddGuardianDialog } from './add-guardian-dialog';
import { useToast } from '@/components/ui/toast';
import { guardiansApi } from '@/lib/api/guardian-portal';
import type { LegalGuardian, GuardianPermissions } from '@psyscale/shared-types';

interface GuardianWithInvitations extends LegalGuardian {
  invitations?: Array<{ status: string }>;
}

interface GuardianSectionProps {
  patientId: string;
  guardians: GuardianWithInvitations[];
  onRefresh: () => void;
  accessToken: string;
  planAllowsPermissions: boolean;
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  mother: 'Mere',
  father: 'Pere',
  legal_guardian: 'Tuteur legal',
  other: 'Autre',
};

const PERMISSION_LABELS: Record<keyof GuardianPermissions, string> = {
  portal: 'Portail',
  invoices: 'Factures',
  video: 'Visio',
  documents: 'Documents',
  messaging: 'Messages',
};

export function GuardianSection({
  patientId,
  guardians,
  onRefresh,
  accessToken,
  planAllowsPermissions,
}: GuardianSectionProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [editGuardian, setEditGuardian] = useState<GuardianWithInvitations | null>(null);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { success, error: showError } = useToast();

  const handleInvite = async (guardianId: string) => {
    setInvitingId(guardianId);
    try {
      await guardiansApi.invite(patientId, guardianId, accessToken);
      success('Invitation envoyee au tuteur');
      onRefresh();
    } catch {
      showError('Impossible d&apos;envoyer l&apos;invitation');
    } finally {
      setInvitingId(null);
    }
  };

  const handleDelete = async (guardianId: string) => {
    setDeletingId(guardianId);
    try {
      await guardiansApi.remove(patientId, guardianId, accessToken);
      success('Tuteur supprime');
      onRefresh();
    } catch {
      showError('Impossible de supprimer le tuteur');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Users className="h-4 w-4" />
          Responsables legaux ({guardians.length}/2)
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdd(true)}
          disabled={guardians.length >= 2}
        >
          Ajouter un tuteur
        </Button>
      </div>

      {guardians.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Aucun tuteur enregistre. Ajoutez un responsable legal pour ce patient mineur.
        </p>
      )}

      {guardians.map((g) => {
        const portalStatus = g.userId
          ? 'active'
          : g.invitations?.[0]?.status === 'pending'
            ? 'pending'
            : 'none';

        return (
          <Card key={g.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground">{g.name}</span>
                    <Badge variant="secondary">
                      {RELATIONSHIP_LABELS[g.relationship] ?? g.relationship}
                    </Badge>
                    {g.isPrimary && <Badge variant="default">Principal</Badge>}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {g.email}
                    </span>
                    {g.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {g.phone}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-2 flex-wrap">
                    {(Object.entries(g.permissions) as [keyof GuardianPermissions, boolean][])
                      .filter(([, v]) => v)
                      .map(([k]) => (
                        <Badge key={k} variant="outline" className="text-xs">
                          {PERMISSION_LABELS[k] ?? k}
                        </Badge>
                      ))}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {portalStatus === 'active' && (
                    <Badge className="bg-green-100 text-green-700">Portail actif</Badge>
                  )}
                  {portalStatus === 'pending' && (
                    <Badge className="bg-yellow-100 text-yellow-700">Invitation envoyee</Badge>
                  )}
                  {portalStatus === 'none' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleInvite(g.id)}
                      disabled={invitingId === g.id}
                      title="Inviter au portail"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditGuardian(g)}
                    title="Modifier"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(g.id)}
                    disabled={deletingId === g.id}
                    className="text-destructive hover:text-destructive"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <AddGuardianDialog
        open={showAdd || !!editGuardian}
        onOpenChange={(open) => {
          if (!open) {
            setShowAdd(false);
            setEditGuardian(null);
          }
        }}
        patientId={patientId}
        accessToken={accessToken}
        onSuccess={onRefresh}
        planAllowsPermissions={planAllowsPermissions}
        guardian={editGuardian ?? undefined}
      />
    </div>
  );
}
