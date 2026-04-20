'use client';

import { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Video, CreditCard } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { appointmentsApi } from '@/lib/api/appointments';
import { patientsApi } from '@/lib/api/patients';
import { psychologistApi } from '@/lib/api/psychologist';
import { cn } from '@/lib/utils';

interface CreateAppointmentDialogProps {
  open: boolean;
  onClose: () => void;
  defaultDate?: Date;
}

const DURATION_OPTIONS = [30, 45, 50, 60, 90, 120];

export function CreateAppointmentDialog({
  open,
  onClose,
  defaultDate,
}: CreateAppointmentDialogProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  const [patientId, setPatientId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [duration, setDuration] = useState(50);
  const [search, setSearch] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'none' | 'prepayment' | 'post_session'>('none');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens with a new default date
  const formattedDefault = defaultDate
    ? `${defaultDate.getFullYear()}-${String(defaultDate.getMonth() + 1).padStart(2, '0')}-${String(defaultDate.getDate()).padStart(2, '0')}`
    : '';

  // Fetch patients for selection
  const { data: patientsData } = useQuery({
    queryKey: ['patients', 'all-for-appointment'],
    queryFn: () => patientsApi.list({ limit: 200, status: 'active' }, session?.accessToken ?? ''),
    enabled: open && !!session?.accessToken,
  });

  // Fetch psy profile for Stripe status + default rate
  const { data: psyProfile } = useQuery({
    queryKey: ['psychologist', 'profile'],
    queryFn: () => psychologistApi.getProfile(session?.accessToken ?? ''),
    enabled: open && !!session?.accessToken,
  });

  const canRequestPayment = psyProfile?.stripeOnboardingComplete === true;

  const patients = patientsData?.data ?? [];

  const filteredPatients = useMemo(() => {
    if (!search.trim()) return patients;
    const q = search.toLowerCase();
    return patients.filter((p) => p.name.toLowerCase().includes(q));
  }, [patients, search]);

  const createMutation = useMutation({
    mutationFn: (data: { patientId: string; scheduledAt: string; duration: number; isOnline?: boolean; paymentMode?: 'none' | 'prepayment' | 'post_session'; paymentAmount?: number }) =>
      appointmentsApi.create(data, session?.accessToken ?? ''),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['appointments'] });
      const patient = patients.find((p) => p.id === patientId);
      if (variables.paymentMode === 'prepayment') {
        success(`RDV créé — lien de paiement envoyé${patient ? ` à ${patient.name}` : ''}`);
      } else if (variables.paymentMode === 'post_session') {
        success(`RDV planifié${patient ? ` avec ${patient.name}` : ''} — vous enverrez le lien de paiement après la séance`);
      } else {
        success(`RDV planifié${patient ? ` avec ${patient.name}` : ''}`);
      }
      handleClose();
    },
    onError: (e: Error) => {
      showError(e.message || 'Erreur lors de la création du RDV');
    },
  });

  const handleClose = () => {
    setPatientId('');
    setDate('');
    setTime('09:00');
    setDuration(50);
    setSearch('');
    setIsOnline(false);
    setPaymentMode('none');
    setPaymentAmount('');
    setError(null);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientId) {
      setError('Sélectionnez un patient');
      return;
    }

    const selectedDate = date || formattedDefault;
    if (!selectedDate) {
      setError('Sélectionnez une date');
      return;
    }

    const scheduledAt = new Date(`${selectedDate}T${time}:00`).toISOString();
    setError(null);

    const amount = paymentMode !== 'none' && paymentAmount ? Number(paymentAmount) : undefined;
    createMutation.mutate({
      patientId,
      scheduledAt,
      duration,
      isOnline,
      paymentMode: paymentMode !== 'none' ? paymentMode : undefined,
      paymentAmount: amount,
    });
  };

  const selectedPatient = patients.find((p) => p.id === patientId);

  return (
    <Dialog open={open} onClose={handleClose} title="Nouveau rendez-vous">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Patient selection */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Patient</label>
          {selectedPatient ? (
            <div className="flex items-center justify-between p-2.5 rounded-lg border border-primary/30 bg-primary/5">
              <span className="text-sm font-medium">{selectedPatient.name}</span>
              <button
                type="button"
                onClick={() => setPatientId('')}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Changer
              </button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher un patient..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                  autoFocus
                />
              </div>
              <div className="max-h-36 overflow-y-auto rounded-lg border border-border">
                {filteredPatients.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-3 text-center">
                    Aucun patient trouvé
                  </p>
                ) : (
                  filteredPatients.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setPatientId(p.id);
                        setSearch('');
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-surface transition-colors border-b border-border last:border-b-0"
                    >
                      {p.name}
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Date"
            type="date"
            required
            value={date || formattedDefault}
            onChange={(e) => setDate(e.target.value)}
          />
          <Input
            label="Heure"
            type="time"
            required
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>

        {/* Duration */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Durée</label>
          <div className="flex flex-wrap gap-2">
            {DURATION_OPTIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDuration(d)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                  duration === d
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white border-border text-muted-foreground hover:bg-surface',
                )}
              >
                {d} min
              </button>
            ))}
          </div>
        </div>

        {/* Visio toggle */}
        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="isOnline"
            checked={isOnline}
            onChange={(e) => setIsOnline(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
          <label htmlFor="isOnline" className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Video className="h-4 w-4" />
            Consultation en visio
          </label>
        </div>

        {/* Payment mode */}
        <div className="space-y-2 pt-1">
          <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
            <CreditCard className="h-4 w-4" />
            Paiement en ligne
          </label>
          {!canRequestPayment ? (
            <p className="text-xs text-muted-foreground/60 ml-5">
              Stripe non configuré — activez les paiements dans Paramètres &gt; Cabinet
            </p>
          ) : (
            <div className="space-y-1.5 ml-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="paymentMode"
                  value="none"
                  checked={paymentMode === 'none'}
                  onChange={() => setPaymentMode('none')}
                  className="h-4 w-4 text-primary focus:ring-primary"
                />
                <span className="text-sm text-muted-foreground">Pas de paiement en ligne</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="paymentMode"
                  value="prepayment"
                  checked={paymentMode === 'prepayment'}
                  onChange={() => {
                    setPaymentMode('prepayment');
                    if (!paymentAmount && psyProfile?.defaultSessionRate) {
                      setPaymentAmount(String(psyProfile.defaultSessionRate));
                    }
                  }}
                  className="h-4 w-4 text-primary focus:ring-primary"
                />
                <span className="text-sm text-muted-foreground">Prépaiement (lien envoyé maintenant)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="paymentMode"
                  value="post_session"
                  checked={paymentMode === 'post_session'}
                  onChange={() => {
                    setPaymentMode('post_session');
                    if (!paymentAmount && psyProfile?.defaultSessionRate) {
                      setPaymentAmount(String(psyProfile.defaultSessionRate));
                    }
                  }}
                  className="h-4 w-4 text-primary focus:ring-primary"
                />
                <span className="text-sm text-muted-foreground">Après la séance (vous enverrez le lien)</span>
              </label>
            </div>
          )}
          {paymentMode !== 'none' && canRequestPayment && (
            <div className="ml-6 mt-2">
              <Input
                label="Montant (€)"
                type="number"
                min={1}
                max={1000}
                step="any"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="ex: 70"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                {paymentMode === 'prepayment'
                  ? 'Le lien de paiement sera envoyé par email au patient immédiatement'
                  : 'Vous pourrez envoyer le lien depuis le calendrier après la séance'}
              </p>
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">{error}</p>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button type="submit" loading={createMutation.isPending}>
            Planifier le RDV
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
