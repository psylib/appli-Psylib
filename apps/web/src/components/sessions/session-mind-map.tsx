'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Network, Sparkles, Loader2, Lock, AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MindMapView } from './mind-map-view';
import { generateMindMap, getMindMap } from '@/lib/api/ai';
import { useSubscriptionPlan } from '@/hooks/use-subscription';

export function SessionMindMap({ sessionId }: { sessionId: string }) {
  const { data: authSession } = useSession();
  const token = authSession?.accessToken ?? '';
  const queryClient = useQueryClient();
  const { isPro, isLoading: planLoading } = useSubscriptionPlan();
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['session-mind-map', sessionId],
    queryFn: () => getMindMap(sessionId, token),
    enabled: !!token && isPro,
  });

  const mutation = useMutation({
    mutationFn: () => generateMindMap(sessionId, token),
    onMutate: () => setError(null),
    onSuccess: (res) => {
      queryClient.setQueryData(['session-mind-map', sessionId], res);
    },
    onError: (e: Error) => setError(e.message || 'Échec de la génération'),
  });

  if (planLoading) return null;

  if (!isPro) {
    return (
      <div className="rounded-xl border border-border bg-surface/60 p-4">
        <div className="mb-1 flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Carte mentale de la séance</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Transformez le contenu de la séance en une arborescence visuelle (thèmes → sous-thèmes).
          Disponible avec les plans <strong>Pro</strong> et <strong>Clinic</strong>.
        </p>
        <Link href="/dashboard/settings/billing" className="mt-2 inline-block text-sm font-medium text-primary hover:underline">
          Découvrir les plans →
        </Link>
      </div>
    );
  }

  const mindMap = data?.mindMap ?? null;

  return (
    <div className="rounded-xl border border-[#7C3AED]/30 bg-[#7C3AED]/5 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-[#7C3AED]" />
          <span className="text-sm font-medium text-[#7C3AED]">Carte mentale de la séance</span>
        </div>
        {mindMap && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => mutation.mutate()}
            loading={mutation.isPending}
          >
            <RefreshCw size={14} />
            Régénérer
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
        </div>
      ) : mindMap ? (
        <MindMapView data={mindMap} />
      ) : (
        <>
          <p className="mb-3 text-sm text-muted-foreground">
            Générez une carte mentale à partir des notes ou du résumé de la séance — pratique pour
            visualiser d’un coup d’œil les thèmes abordés et leurs ramifications.
          </p>
          <Button size="sm" onClick={() => mutation.mutate()} loading={mutation.isPending}>
            <Sparkles size={14} />
            Générer la carte mentale
          </Button>
        </>
      )}

      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-destructive" role="alert">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
