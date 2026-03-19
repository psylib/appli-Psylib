'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Loader2, Save, Globe } from 'lucide-react';

const DAYS = [
  { label: 'Lundi', value: 0 },
  { label: 'Mardi', value: 1 },
  { label: 'Mercredi', value: 2 },
  { label: 'Jeudi', value: 3 },
  { label: 'Vendredi', value: 4 },
  { label: 'Samedi', value: 5 },
  { label: 'Dimanche', value: 6 },
];

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = String(i).padStart(2, '0');
  return `${h}:00`;
});

interface AvailabilitySlot {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface DayState {
  isActive: boolean;
  startTime: string;
  endTime: string;
}

const DEFAULT_DAY: DayState = { isActive: false, startTime: '09:00', endTime: '18:00' };

export function AvailabilityManager() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);

  const [days, setDays] = useState<DayState[]>(DAYS.map(() => ({ ...DEFAULT_DAY })));

  const { data: slots, isLoading } = useQuery({
    queryKey: ['availability'],
    queryFn: () => apiClient.get<AvailabilitySlot[]>('/availability', session?.accessToken ?? ''),
    enabled: !!session?.accessToken,
  });

  useEffect(() => {
    if (!slots) return;
    setDays(
      DAYS.map(({ value }) => {
        const existing = slots.find((s) => s.dayOfWeek === value);
        if (existing) {
          return { isActive: existing.isActive, startTime: existing.startTime, endTime: existing.endTime };
        }
        return { ...DEFAULT_DAY };
      }),
    );
  }, [slots]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const activeSlots = DAYS.filter((_, i) => days[i]?.isActive).map(({ value }, _i) => {
        const dayState = days[value];
        return {
          dayOfWeek: value,
          startTime: dayState?.startTime ?? '09:00',
          endTime: dayState?.endTime ?? '18:00',
          isActive: true,
        };
      });
      return apiClient.post('/availability', { slots: activeSlots }, session?.accessToken ?? '');
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['availability'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const toggleDay = (idx: number) => {
    setDays((prev) => {
      const next = [...prev];
      const current = next[idx];
      if (current) {
        next[idx] = { ...current, isActive: !current.isActive };
      }
      return next;
    });
  };

  const updateTime = (idx: number, field: 'startTime' | 'endTime', value: string) => {
    setDays((prev) => {
      const next = [...prev];
      const current = next[idx];
      if (current) {
        next[idx] = { ...current, [field]: value };
      }
      return next;
    });
  };

  // Récupère le slug de la psy pour le lien profil public
  const psySlug = (session?.user as { slug?: string } | undefined)?.slug;

  return (
    <div className="rounded-xl border border-border bg-white p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-medium text-foreground">Mes disponibilités</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Ces créneaux seront affichés sur votre profil public pour la prise de RDV en ligne.
          </p>
        </div>
        {psySlug && (
          <a
            href={`/psy/${psySlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-primary hover:underline flex-shrink-0"
          >
            <Globe className="w-3.5 h-3.5" />
            Voir mon profil
          </a>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-2">
          {DAYS.map(({ label }, idx) => {
            const day = days[idx] ?? DEFAULT_DAY;
            return (
              <div
                key={label}
                className={`flex items-center gap-3 p-3 rounded-lg border transition ${
                  day.isActive ? 'border-primary/30 bg-primary/5' : 'border-border bg-white'
                }`}
              >
                {/* Toggle */}
                <button
                  type="button"
                  onClick={() => toggleDay(idx)}
                  className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
                    day.isActive ? 'bg-primary' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      day.isActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>

                <span
                  className={`text-sm w-20 font-medium flex-shrink-0 ${
                    day.isActive ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {label}
                </span>

                {day.isActive ? (
                  <div className="flex items-center gap-2 flex-1">
                    <select
                      value={day.startTime}
                      onChange={(e) => updateTime(idx, 'startTime', e.target.value)}
                      className="px-2 py-1 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                    >
                      {HOURS.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                    <span className="text-muted-foreground text-sm">→</span>
                    <select
                      value={day.endTime}
                      onChange={(e) => updateTime(idx, 'endTime', e.target.value)}
                      className="px-2 py-1 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                    >
                      {HOURS.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Fermé</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending || isLoading}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition"
      >
        {saveMutation.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        {saved ? 'Sauvegardé !' : 'Sauvegarder mes disponibilités'}
      </button>

      {saveMutation.isError && (
        <p className="text-sm text-red-600">
          Une erreur est survenue. Veuillez réessayer.
        </p>
      )}
    </div>
  );
}
