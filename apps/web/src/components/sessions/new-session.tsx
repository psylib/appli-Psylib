'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePatients } from '@/hooks/use-dashboard';
import { sessionsApi } from '@/lib/api/sessions';

interface NewSessionContentProps {
  preselectedPatientId?: string;
}

export function NewSessionContent({ preselectedPatientId }: NewSessionContentProps) {
  const router = useRouter();
  const { data: authSession } = useSession();
  const { data: patients } = usePatients({ limit: 100 } as Parameters<typeof usePatients>[0]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    patientId: preselectedPatientId ?? '',
    date: new Date().toISOString().slice(0, 16),
    duration: '50',
    type: 'individual',
    rate: '80',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId) { setError('Sélectionnez un patient'); return; }

    setLoading(true);
    setError(null);

    try {
      const session = await sessionsApi.create(
        {
          patientId: form.patientId,
          date: new Date(form.date).toISOString(),
          duration: Number(form.duration),
          type: form.type as 'individual' | 'group' | 'online',
          rate: form.rate ? Number(form.rate) : undefined,
        },
        authSession?.accessToken ?? '',
      );
      router.push(`/dashboard/sessions/${session.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la création');
      setLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Retour">
          <ArrowLeft size={18} />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Nouvelle séance</h1>
      </div>

      <div className="rounded-xl border border-border bg-white shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Patient */}
          <div className="space-y-1.5">
            <label htmlFor="patient-select" className="block text-sm font-medium text-foreground">
              Patient <span className="text-destructive" aria-hidden>*</span>
            </label>
            <select
              id="patient-select"
              value={form.patientId}
              onChange={(e) => setForm({ ...form, patientId: e.target.value })}
              required
              className="flex h-11 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Sélectionner un patient...</option>
              {patients?.data.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <Input
            label="Date et heure"
            type="datetime-local"
            required
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Durée (minutes)"
              type="number"
              min="5"
              max="480"
              required
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
            />
            <Input
              label="Tarif (€)"
              type="number"
              min="0"
              value={form.rate}
              onChange={(e) => setForm({ ...form, rate: e.target.value })}
            />
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-foreground">Type de séance</p>
            <div className="flex gap-2">
              {[
                { value: 'individual', label: 'Individuel' },
                { value: 'online', label: 'En ligne' },
                { value: 'group', label: 'Groupe' },
              ].map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm({ ...form, type: t.value })}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors min-h-[44px] border ${
                    form.type === t.value
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-foreground border-border hover:bg-surface'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Annuler
            </Button>
            <Button type="submit" loading={loading}>
              Créer la séance
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
