'use client';

import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { videoApi } from '@/lib/api/video';
import { PsyVideoRoom } from '@/components/video/video-room';

export default function ConsultationRoomPage() {
  const { roomId } = useParams<{ roomId: string }>(); // roomId = appointmentId
  const { data: session } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [tokenData, setTokenData] = useState<{
    token: string;
    wsUrl: string;
    roomName: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [duration] = useState(50);

  useEffect(() => {
    if (!session?.accessToken) return;

    const init = async () => {
      try {
        // Ensure room exists
        await videoApi.createRoom(roomId, session.accessToken);
        // Get psy token
        const data = await videoApi.getPsyToken(roomId, session.accessToken);
        setTokenData(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Impossible de demarrer la visio';
        alert(message);
        router.push('/dashboard/video');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [session?.accessToken, roomId, router]);

  const handleEndCall = async () => {
    if (!session?.accessToken) return;
    try {
      await videoApi.endRoom(roomId, session.accessToken);
      queryClient.invalidateQueries({ queryKey: ['video-today'] });
      router.push('/dashboard/video');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la fermeture';
      alert(message);
    }
  };

  if (loading || !tokenData) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Connexion a la salle de visio...</p>
        </div>
      </div>
    );
  }

  return (
    <PsyVideoRoom
      token={tokenData.token}
      wsUrl={tokenData.wsUrl}
      plannedDurationMin={duration}
      notesPanel={
        <textarea
          className="w-full h-64 border border-border rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="Prenez vos notes ici..."
        />
      }
      onCallEnd={handleEndCall}
    />
  );
}
