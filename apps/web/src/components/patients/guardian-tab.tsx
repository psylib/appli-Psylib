'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Shield, Send, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GuardianSection } from './guardian-section';
import { guardiansApi } from '@/lib/api/guardian-portal';
import { useToast } from '@/components/ui/toast';
import type { LegalGuardian, GuardianPermissions } from '@psyscale/shared-types';

interface GuardianWithInvitations extends LegalGuardian {
  invitations?: Array<{ status: string }>;
  consentRequests?: Array<{
    id: string;
    consentType: string;
    status: 'pending' | 'approved' | 'refused';
    respondedAt: string | null;
  }>;
}

interface GuardianTabProps {
  patientId: string;
}

const CONSENT_TYPES = [
  { value: 'data_processing', label: 'Traitement des donnees' },
  { value: 'ai_processing', label: 'Traitement IA' },
  { value: 'video_consultation', label: 'Consultation video' },
];

const CONSENT_STATUS_CONFIG = {
  pending: { icon: Clock, label: 'En attente', badgeClass: 'bg-yellow-100 text-yellow-700' },
  approved: { icon: CheckCircle2, label: 'Approuve', badgeClass: 'bg-green-100 text-green-700' },
  refused: { icon: XCircle, label: 'Refuse', badgeClass: 'bg-red-100 text-red-700' },
} as const;

export function GuardianTab({ patientId }: GuardianTabProps) {
  const { data: session } = useSession();
  const [guardians, setGuardians] = useState<GuardianWithInvitations[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingConsent, setRequestingConsent] = useState<string | null>(null);
  const { success, error: showError } = useToast();

  const token = session?.accessToken ?? '';

  const fetchGuardians = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await guardiansApi.list(patientId, token);
      setGuardians(data as GuardianWithInvitations[]);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [patientId, token]);

  useEffect(() => {
    fetchGuardians();
  }, [fetchGuardians]);

  const handleRequestConsent = async (guardianId: string, consentType: string) => {
    setRequestingConsent(`${guardianId}-${consentType}`);
    try {
      await guardiansApi.requestConsent(patientId, guardianId, { consentType }, token);
      success('Demande de consentement envoyee');
      fetchGuardians();
    } catch {
      showError('Impossible d&apos;envoyer la demande de consentement');
    } finally {
      setRequestingConsent(null);
    }
  };

  if (loading) {
    return (
      <section className="rounded-xl border border-border bg-white shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-surface rounded w-48" />
          <div className="h-20 bg-surface rounded" />
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {/* Guardian list with CRUD */}
      <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden p-6">
        <GuardianSection
          patientId={patientId}
          guardians={guardians}
          onRefresh={fetchGuardians}
          accessToken={token}
          planAllowsPermissions={true}
        />
      </div>

      {/* Consent status */}
      {guardians.length > 0 && (
        <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Consentements parentaux
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Suivez les consentements des responsables legaux
            </p>
          </div>
          <div className="divide-y divide-border">
            {guardians.map((guardian) => (
              <div key={guardian.id} className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-foreground">{guardian.name}</span>
                  {guardian.isPrimary && (
                    <Badge variant="default" className="text-xs">Principal</Badge>
                  )}
                </div>
                <div className="space-y-2 ml-1">
                  {CONSENT_TYPES.map((ct) => {
                    const consent = guardian.consentRequests?.find(
                      (c) => c.consentType === ct.value,
                    );
                    const status = consent?.status;
                    const config = status ? CONSENT_STATUS_CONFIG[status] : null;

                    return (
                      <div
                        key={ct.value}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-muted-foreground">{ct.label}</span>
                        <div className="flex items-center gap-2">
                          {config ? (
                            <Badge className={config.badgeClass}>
                              <config.icon className="h-3 w-3 mr-1" />
                              {config.label}
                            </Badge>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRequestConsent(guardian.id, ct.value)}
                              disabled={requestingConsent === `${guardian.id}-${ct.value}`}
                              className="text-xs"
                            >
                              <Send className="h-3 w-3 mr-1" />
                              Demander
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
