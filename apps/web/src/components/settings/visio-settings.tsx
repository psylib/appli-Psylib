'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/toast';
import { apiClient } from '@/lib/api/client';
import { Loader2, Video, Info } from 'lucide-react';

interface NetworkProfile {
  offersVisio: boolean;
}

export function VisioSettings({ token: tokenProp }: { token?: string }) {
  const { data: session, status } = useSession();
  const { success, error: toastError } = useToast();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const token = tokenProp || session?.accessToken || '';

  useEffect(() => {
    if (status === 'loading') return;
    if (!token) { setLoading(false); return; }
    apiClient
      .get<NetworkProfile>('/network/profile', token)
      .then((profile) => {
        setEnabled(profile.offersVisio);
      })
      .catch(() => {
        // Profile may not exist yet — default to false
        setEnabled(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, status]);

  const handleToggle = async () => {
    if (!token) return;
    const newValue = !enabled;
    setToggling(true);

    try {
      await apiClient.put<NetworkProfile>(
        '/network/profile',
        { offersVisio: newValue },
        token,
      );
      setEnabled(newValue);
      success(
        newValue
          ? 'Visioconference activee. Vos patients pourront choisir ce mode lors de la reservation.'
          : 'Visioconference desactivee.',
      );
    } catch {
      toastError('Erreur lors de la mise a jour.');
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-white p-6">
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-white p-6 space-y-4">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <h2 className="text-base font-medium text-foreground flex items-center gap-2">
            <Video className="w-4 h-4 text-sky-600" />
            Visioconference
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Proposez des seances en visio a vos patients lors de la prise de rendez-vous en ligne.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {toggling && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
          <button
            type="button"
            onClick={() => void handleToggle()}
            disabled={toggling}
            className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
              enabled ? 'bg-sky-600' : 'bg-gray-200'
            } disabled:opacity-50`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Status badge */}
      <div>
        {enabled ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-700">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            Actif
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            Inactif
          </span>
        )}
      </div>

      {/* Info box */}
      <div className="flex gap-3 p-3 rounded-lg bg-sky-50/50 border border-sky-100">
        <Info className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            En activant cette option, vos patients verront un choix{' '}
            <strong className="text-foreground">&quot;Au cabinet&quot;</strong> ou{' '}
            <strong className="text-foreground">&quot;En visio&quot;</strong> lors de la
            reservation en ligne.
          </p>
          <p>
            Les seances en visio utilisent notre systeme de visioconference integre,
            securise et conforme HDS.
          </p>
        </div>
      </div>
    </div>
  );
}
