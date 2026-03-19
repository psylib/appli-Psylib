'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SessionNoteEditor } from './session-note-editor';
import { useSession2 } from '@/hooks/use-dashboard';
import { formatDateTime } from '@/lib/utils';

export function SessionDetailContent({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const { data: session, isLoading } = useSession2(sessionId);

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Séance introuvable</p>
        <Button variant="link" onClick={() => router.back()}>Retour</Button>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Retour">
          <ArrowLeft size={18} />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Séance du {formatDateTime(session.date)}
          </h1>
          <p className="text-sm text-muted-foreground">
            {session.duration} min • {session.type === 'individual' ? 'Individuel' : session.type === 'online' ? 'En ligne' : 'Groupe'}
            {session.rate ? ` • ${Number(session.rate)}€` : ''}
          </p>
        </div>
      </div>

      {/* Tags */}
      {session.tags && session.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {session.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Éditeur de notes */}
      <div className="rounded-xl border border-border bg-white shadow-sm p-6">
        <SessionNoteEditor
          sessionId={sessionId}
          initialNotes={session.notes}
        />
      </div>
    </div>
  );
}
