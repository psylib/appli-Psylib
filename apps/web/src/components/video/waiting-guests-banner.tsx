'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { UserPlus, Check, X, Loader2 } from 'lucide-react';
import { videoApi, type GuestInfo } from '@/lib/api/video';

interface WaitingGuestsBannerProps {
  appointmentId: string;
}

/**
 * Bannière "salle d'attente" : interroge périodiquement la liste des invités
 * en attente et permet au psy de les admettre ou les refuser.
 */
export function WaitingGuestsBanner({ appointmentId }: WaitingGuestsBannerProps) {
  const { data: session } = useSession();
  const [guests, setGuests] = useState<GuestInfo[]>([]);
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  const poll = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const list = await videoApi.listGuests(appointmentId, session.accessToken);
      setGuests(list.filter((g) => g.status === 'pending'));
    } catch {
      /* silencieux — réessai au prochain tick */
    }
  }, [appointmentId, session?.accessToken]);

  useEffect(() => {
    poll();
    const id = setInterval(poll, 4000);
    return () => clearInterval(id);
  }, [poll]);

  const act = async (guestId: string, action: 'admit' | 'deny') => {
    if (!session?.accessToken) return;
    setBusy((b) => ({ ...b, [guestId]: true }));
    try {
      if (action === 'admit') await videoApi.admitGuest(guestId, session.accessToken);
      else await videoApi.denyGuest(guestId, session.accessToken);
      setGuests((g) => g.filter((x) => x.id !== guestId));
    } catch {
      setBusy((b) => ({ ...b, [guestId]: false }));
    }
  };

  if (guests.length === 0) return null;

  return (
    <div className="absolute left-1/2 top-4 z-40 w-[min(92%,26rem)] -translate-x-1/2 space-y-2">
      {guests.map((g) => (
        <div
          key={g.id}
          className="flex items-center gap-3 rounded-xl border border-white/10 bg-gray-900/90 px-4 py-3 shadow-2xl backdrop-blur"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0D9488]/20 text-[#5eead4]">
            <UserPlus className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{g.displayName}</p>
            <p className="text-xs text-white/50">souhaite rejoindre la visio</p>
          </div>
          {busy[g.id] ? (
            <Loader2 className="h-5 w-5 animate-spin text-white/60" />
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => act(g.id, 'deny')}
                className="rounded-full bg-white/10 p-2 text-white hover:bg-red-500/80"
                title="Refuser"
              >
                <X className="h-4 w-4" />
              </button>
              <button
                onClick={() => act(g.id, 'admit')}
                className="inline-flex items-center gap-1 rounded-full bg-[#0D9488] px-3 py-2 text-sm font-medium text-white hover:bg-[#0b7d72]"
              >
                <Check className="h-4 w-4" /> Admettre
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
