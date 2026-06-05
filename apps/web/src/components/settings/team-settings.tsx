'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useToast } from '@/components/ui/toast';
import { Loader2, UserPlus, Trash2, Users, Lock } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { assistantsApi } from '@/lib/api/assistants';
import { ApiError } from '@/lib/api/client';
import type { AssistantSummary } from '@psyscale/shared-types';

const STATUS_META: Record<
  AssistantSummary['status'],
  { label: string; className: string }
> = {
  pending: { label: 'En attente', className: 'bg-amber-50 text-amber-700' },
  active: { label: 'Actif·ve', className: 'bg-green-50 text-green-700' },
  revoked: { label: 'Révoqué·e', className: 'bg-gray-100 text-muted-foreground' },
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function TeamSettings({ token: tokenProp }: { token?: string }) {
  const { data: session, status } = useSession();
  const { success, error: toastError } = useToast();

  const token = tokenProp || session?.accessToken || '';

  const [assistants, setAssistants] = useState<AssistantSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [upsell, setUpsell] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  const [confirmRevoke, setConfirmRevoke] = useState<AssistantSummary | null>(null);
  const [revoking, setRevoking] = useState(false);

  const loadAssistants = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await assistantsApi.list(token);
      setAssistants(data);
      setUpsell(null);
    } catch (e) {
      if (e instanceof ApiError && e.statusCode === 403) {
        setUpsell(e.message);
      } else {
        toastError('Impossible de charger votre équipe.');
      }
    } finally {
      setLoading(false);
    }
  }, [token, toastError]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!token) {
      setLoading(false);
      return;
    }
    void loadAssistants();
  }, [loadAssistants, status, token]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !name.trim() || !email.trim()) return;

    setInviting(true);
    try {
      await assistantsApi.invite({ name: name.trim(), email: email.trim() }, token);
      success(`Invitation envoyée à ${email.trim()}.`);
      setName('');
      setEmail('');
      await loadAssistants();
    } catch (e) {
      if (e instanceof ApiError && e.statusCode === 403) {
        setUpsell(e.message);
        toastError(e.message);
      } else if (e instanceof ApiError) {
        toastError(e.message);
      } else {
        toastError("Erreur lors de l'invitation.");
      }
    } finally {
      setInviting(false);
    }
  };

  const handleRevoke = async () => {
    if (!token || !confirmRevoke) return;
    setRevoking(true);
    try {
      await assistantsApi.revoke(confirmRevoke.id, token);
      success(`Accès de ${confirmRevoke.name} révoqué.`);
      setConfirmRevoke(null);
      await loadAssistants();
    } catch {
      toastError('Erreur lors de la révocation.');
    } finally {
      setRevoking(false);
    }
  };

  // Plan ne permet pas (ou limite atteinte) — message d'upsell amical
  if (upsell) {
    return (
      <div className="rounded-xl border border-border bg-white p-6 space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-medium text-foreground">
            Invitez votre équipe
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{upsell}</p>
        </div>
        <Link
          href="/dashboard/settings/billing"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
        >
          Découvrir les plans
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Formulaire d'invitation */}
      <div className="rounded-xl border border-border bg-white p-6 space-y-4">
        <div>
          <h2 className="text-base font-medium text-foreground">
            Inviter un·e assistant·e
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Il·elle pourra gérer votre agenda et vos patients, sans accéder aux
            notes cliniques ni à la facturation.
          </p>
        </div>

        <form onSubmit={(e) => void handleInvite(e)} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div>
            <label htmlFor="assistant-name" className="block text-sm font-medium text-muted-foreground mb-1">
              Nom
            </label>
            <input
              id="assistant-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Camille Dupont"
              required
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label htmlFor="assistant-email" className="block text-sm font-medium text-muted-foreground mb-1">
              Email
            </label>
            <input
              id="assistant-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="camille@exemple.fr"
              required
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <button
            type="submit"
            disabled={inviting || !name.trim() || !email.trim()}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-50"
          >
            {inviting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            Inviter
          </button>
        </form>
      </div>

      {/* Liste des assistant·es */}
      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-base font-medium text-foreground">Votre équipe</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : assistants.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Aucun·e assistant·e pour le moment"
            description="Invitez un·e collaborateur·rice pour qu'il·elle vous aide à gérer votre agenda et vos patients."
          />
        ) : (
          <ul className="divide-y divide-border">
            {assistants.map((a) => {
              const meta = STATUS_META[a.status];
              return (
                <li key={a.id} className="flex items-center gap-3 px-6 py-4">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {a.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{a.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{a.email}</p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${meta.className}`}>
                      {meta.label}
                    </span>
                    <span className="hidden text-xs text-muted-foreground sm:inline">
                      {formatDate(a.createdAt)}
                    </span>
                    {a.status !== 'revoked' && (
                      <button
                        type="button"
                        onClick={() => setConfirmRevoke(a)}
                        className="rounded-md p-1.5 transition-colors hover:bg-red-50"
                        aria-label={`Révoquer l'accès de ${a.name}`}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={confirmRevoke !== null}
        onClose={() => setConfirmRevoke(null)}
        onConfirm={handleRevoke}
        title="Révoquer cet accès ?"
        description={
          confirmRevoke
            ? `${confirmRevoke.name} n'aura plus accès à votre espace. Cette action est immédiate.`
            : ''
        }
        confirmLabel="Révoquer"
        loading={revoking}
      />
    </div>
  );
}
