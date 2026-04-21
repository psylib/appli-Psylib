'use client';

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Video, Clock, User, Users, ArrowRight, CheckCircle } from 'lucide-react';
import { videoApi } from '@/lib/api/video';

const STATUS_CONFIG = {
  upcoming: { label: 'A venir', color: 'text-muted-foreground', bg: 'bg-muted' },
  ready: { label: 'Pret', color: 'text-accent', bg: 'bg-accent/10' },
  patient_waiting: { label: 'Patient attend', color: 'text-orange-600', bg: 'bg-orange-50' },
  active: { label: 'En cours', color: 'text-green-600', bg: 'bg-green-50' },
  ended: { label: 'Terminee', color: 'text-muted-foreground', bg: 'bg-muted' },
} as const;

export default function VideoPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const token = session?.accessToken || '';

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['video-today'],
    queryFn: () => videoApi.getTodayRooms(token),
    enabled: !!token,
    refetchInterval: 15000,
  });

  const [startError, setStartError] = useState<string | null>(null);

  const handleStart = async (appointmentId: string) => {
    try {
      setStartError(null);
      await videoApi.createRoom(appointmentId, token);
      router.push(`/dashboard/video/${appointmentId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Impossible de demarrer la visio';
      setStartError(msg);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Consultations video</h1>
          <p className="text-sm text-muted-foreground mt-1">Vos visios du jour</p>
        </div>
      </div>

      {startError && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive" role="alert">
          {startError}
        </div>
      )}

      <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Chargement...</div>
        ) : rooms.length === 0 ? (
          <div className="p-12 text-center">
            <Video className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground">Aucune consultation video aujourd&apos;hui</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {rooms.map((room) => {
              const config = STATUS_CONFIG[room.status];
              const time = new Date(room.scheduledAt).toLocaleTimeString('fr-FR', {
                hour: '2-digit', minute: '2-digit',
              });

              return (
                <div key={room.appointmentId} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="text-lg font-semibold text-foreground w-14">{time}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">{room.patientName}</span>
                        {room.participantCount > 1 && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            <Users className="h-3 w-3" />
                            {room.participantsJoined}/{room.participantCount} connectes
                          </span>
                        )}
                      </div>
                      {room.participantNames && room.participantNames.length > 0 && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          + {room.participantNames.join(', ')}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{room.duration} min</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.bg} ${config.color}`}>
                      {room.status === 'ended' && <CheckCircle className="h-3 w-3" />}
                      {config.label}
                    </span>
                    {(room.status === 'ready' || room.status === 'patient_waiting') && (
                      <button
                        onClick={() => handleStart(room.appointmentId)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
                      >
                        {room.status === 'patient_waiting' ? 'Rejoindre' : 'Demarrer'}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                    {room.status === 'active' && (
                      <button
                        onClick={() => router.push(`/dashboard/video/${room.appointmentId}`)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                      >
                        En cours
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
