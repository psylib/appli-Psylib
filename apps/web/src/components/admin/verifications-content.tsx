'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, ShieldX, Clock, AlertTriangle } from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PendingVerification {
  id: string;
  name: string;
  email: string;
  adeliNumber: string | null;
  verificationNote: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function annuaireSearchUrl(adeli: string | null): string {
  // Annuaire santé officiel — permet de croiser nom ↔ numéro manuellement.
  const q = adeli ? encodeURIComponent(adeli) : '';
  return `https://annuaire.sante.fr/web/site-pro/recherche?q=${q}`;
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

interface RowProps {
  item: PendingVerification;
  token?: string;
  onDone: () => void;
}

function VerificationRow({ item, token, onDone }: RowProps) {
  const [confirmReject, setConfirmReject] = useState(false);
  const [reason, setReason] = useState('');

  const approve = useMutation({
    mutationFn: () =>
      apiClient.post(`/admin/verifications/${item.id}/approve`, {}, token),
    onSuccess: onDone,
  });

  const reject = useMutation({
    mutationFn: () =>
      apiClient.post(
        `/admin/verifications/${item.id}/reject`,
        { reason: reason || undefined },
        token,
      ),
    onSuccess: onDone,
  });

  const busy = approve.isPending || reject.isPending;

  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{item.name}</p>
          <p className="text-sm text-muted-foreground">{item.email}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-mono bg-surface px-2 py-0.5 rounded text-foreground">
              {item.adeliNumber ?? '—'}
            </span>
            <a
              href={annuaireSearchUrl(item.adeliNumber)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2"
            >
              Vérifier à l&apos;annuaire santé ↗
            </a>
          </div>
          {item.verificationNote && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded">
              <AlertTriangle size={13} aria-hidden />
              {item.verificationNote}
            </p>
          )}
          <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock size={12} aria-hidden /> Inscrit le {formatDate(item.createdAt)}
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => approve.mutate()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            <ShieldCheck size={16} aria-hidden />
            Valider
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirmReject((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            <ShieldX size={16} aria-hidden />
            Rejeter
          </button>
        </div>
      </div>

      {confirmReject && (
        <div className="mt-4 border-t border-border pt-4">
          <label
            htmlFor={`reason-${item.id}`}
            className="block text-sm font-medium text-foreground mb-1"
          >
            Motif du rejet (optionnel)
          </label>
          <textarea
            id={`reason-${item.id}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Ex : nom déclaré ne correspond pas au titulaire du numéro RPPS"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => reject.mutate()}
              className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              Confirmer le rejet
            </button>
            <button
              type="button"
              onClick={() => setConfirmReject(false)}
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-surface"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {(approve.error || reject.error) && (
        <p className="mt-3 text-sm text-red-600">
          Action échouée. Réessayez.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function VerificationsContent() {
  const session = useSession();
  const token = session.data?.accessToken;
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<PendingVerification[], ApiError>({
    queryKey: ['admin-verifications'],
    queryFn: () =>
      apiClient.get<PendingVerification[]>('/admin/verifications', token),
    enabled: !!token,
    staleTime: 30 * 1000,
  });

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ['admin-verifications'] });

  if (error instanceof ApiError && error.statusCode === 403) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Accès admin requis.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Vérifications d&apos;identité
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Inscriptions dont le numéro ADELI/RPPS n&apos;a pas pu être
          auto-validé (annuaire indisponible ou nom ne correspondant pas). Le
          profil public reste masqué tant qu&apos;il n&apos;est pas validé.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-white py-16 text-center">
          <ShieldCheck size={32} className="text-accent" aria-hidden />
          <p className="font-medium text-foreground">Aucune vérification en attente</p>
          <p className="text-sm text-muted-foreground">
            Toutes les inscriptions ont été traitées.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((item) => (
            <VerificationRow
              key={item.id}
              item={item}
              token={token}
              onDone={refresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}
