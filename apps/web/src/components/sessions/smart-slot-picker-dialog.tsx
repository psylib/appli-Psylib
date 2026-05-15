'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Video, MapPin, CreditCard, Calendar, ArrowLeft, AlertCircle, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { appointmentsApi } from '@/lib/api/appointments';
import { patientsApi } from '@/lib/api/patients';
import { psychologistApi } from '@/lib/api/psychologist';
import { availabilityApi } from '@/lib/api/availability';
import { useUIStore } from '@/store/ui.store';
import { MiniCalendar } from './mini-calendar';
import { TimeSlotPills } from './time-slot-pills';
import { ParticipantMultiSelect } from '@/components/calendar/participant-multi-select';
import { cn } from '@/lib/utils';

const DURATION_OPTIONS = [30, 45, 50, 60, 90, 120];

// ─── Paris timezone helpers ─────────────────────────────────────────────────

const PARIS_TZ = 'Europe/Paris';

/** Convert a UTC ISO string to a Paris date string YYYY-MM-DD */
function utcToParisDay(isoStr: string): string {
  return new Intl.DateTimeFormat('fr-CA', { timeZone: PARIS_TZ }).format(new Date(isoStr));
}

/** Convert a UTC ISO string to a Paris HH:MM string */
function utcToParisTime(isoStr: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: PARIS_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(isoStr));
}

/**
 * Given a Paris date string (YYYY-MM-DD) and a Paris time string (HH:MM),
 * returns the equivalent UTC ISO string.
 */
function parisToUtcIso(dateStr: string, timeStr: string): string {
  // Build a date string that Intl can interpret as Paris local time
  // Using toLocaleString trick: create a Date from 'YYYY-MM-DDTHH:MM:00' treated
  // as UTC, then compensate using the Paris offset.
  // Simpler: Use the Temporal API polyfill pattern via Date constructor.
  const naive = new Date(`${dateStr}T${timeStr}:00`);
  // Determine the UTC offset for this naive date in Paris
  const parisFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: PARIS_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = parisFormatter.formatToParts(naive);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '0';
  const parisFromNaive = new Date(
    `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}Z`,
  );
  const offsetMs = naive.getTime() - parisFromNaive.getTime();
  return new Date(naive.getTime() - offsetMs).toISOString();
}

/** Format a Paris day string for display */
function formatParisDay(dateStr: string): string {
  const parts = dateStr.split('-');
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/** Format slot selected for the summary bar */
function formatSlotSummary(dateStr: string, timeStr: string, duration: number): string {
  const dayLabel = formatParisDay(dateStr);
  return `${dayLabel} à ${timeStr} · ${duration} min`;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function SmartSlotPickerDialog() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const { smartSlotPickerOpen, smartSlotPickerDefaultPatientId, closeSmartSlotPicker } = useUIStore();

  // ── Step state ──
  const [step, setStep] = useState<1 | 2>(1);

  // ── Step 1 state ──
  const [patientId, setPatientId] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [duration, setDuration] = useState(50);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // ── Step 2 state ──
  const [isOnline, setIsOnline] = useState(false);
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [paymentMode, setPaymentMode] = useState<'none' | 'prepayment' | 'post_session'>('none');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // ── Fetch date window: current month + next month ──
  const fromDate = useMemo(() => {
    const now = new Date();
    // From today (not past)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const windowStart = today > monthStart ? today : monthStart;
    return windowStart.toISOString();
  }, [currentMonth]);

  const toDate = useMemo(() => {
    // Show two months ahead
    const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 2, 0, 23, 59, 59);
    return end.toISOString();
  }, [currentMonth]);

  // ── Queries ──
  const { data: patientsData } = useQuery({
    queryKey: ['patients', 'all-for-smart-picker'],
    queryFn: () => patientsApi.list({ limit: 200, status: 'active' }, session?.accessToken ?? ''),
    enabled: smartSlotPickerOpen && !!session?.accessToken,
  });

  const { data: psyProfile } = useQuery({
    queryKey: ['psychologist', 'profile'],
    queryFn: () => psychologistApi.getProfile(session?.accessToken ?? ''),
    enabled: smartSlotPickerOpen && !!session?.accessToken,
  });

  const {
    data: timeslots,
    isLoading: slotsLoading,
    isError: slotsError,
    refetch: refetchSlots,
  } = useQuery({
    queryKey: ['available-timeslots', fromDate, toDate, duration],
    queryFn: () => availabilityApi.getTimeslots(fromDate, toDate, duration, session?.accessToken ?? ''),
    enabled: smartSlotPickerOpen && !!session?.accessToken,
    staleTime: 30_000,
  });

  // ── Derived data ──
  const patients = useMemo(() => patientsData?.data ?? [], [patientsData?.data]);

  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients;
    const q = patientSearch.toLowerCase();
    return patients.filter((p) => p.name.toLowerCase().includes(q));
  }, [patients, patientSearch]);

  const selectedPatient = useMemo(() => patients.find((p) => p.id === patientId), [patients, patientId]);

  const canRequestPayment = psyProfile?.stripeOnboardingComplete === true;

  /** Map of YYYY-MM-DD → ['HH:MM', ...] in Paris time */
  const slotsByDay = useMemo<Map<string, string[]>>(() => {
    const map = new Map<string, string[]>();
    for (const iso of timeslots ?? []) {
      const day = utcToParisDay(iso);
      const time = utcToParisTime(iso);
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(time);
    }
    // Sort times within each day
    for (const [day, times] of map) {
      map.set(day, times.sort());
    }
    return map;
  }, [timeslots]);

  const availableDays = useMemo(() => new Set(slotsByDay.keys()), [slotsByDay]);

  const slotsForSelectedDay = useMemo<string[]>(
    () => (selectedDay ? slotsByDay.get(selectedDay) ?? [] : []),
    [selectedDay, slotsByDay],
  );

  const selectedDayLabel = useMemo(
    () => (selectedDay ? formatParisDay(selectedDay) : ''),
    [selectedDay],
  );

  const slotSummary = useMemo(
    () => (selectedDay && selectedTime ? formatSlotSummary(selectedDay, selectedTime, duration) : null),
    [selectedDay, selectedTime, duration],
  );

  // ── Auto-select first available day when slots load ──
  useEffect(() => {
    if (slotsLoading || !timeslots) return;
    if (!selectedDay || !availableDays.has(selectedDay)) {
      // Find the first available day in current month view
      const currentMonthStr = `${String(currentMonth.getFullYear())}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
      const firstInMonth = [...availableDays].find((d) => d.startsWith(currentMonthStr));
      const firstAvailable = firstInMonth ?? [...availableDays].sort()[0];
      if (firstAvailable) {
        setSelectedDay(firstAvailable);
        setSelectedTime(null);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeslots, slotsLoading]);

  // ── Pre-select patient from store ──
  useEffect(() => {
    if (smartSlotPickerOpen && smartSlotPickerDefaultPatientId) {
      setPatientId(smartSlotPickerDefaultPatientId);
    }
  }, [smartSlotPickerOpen, smartSlotPickerDefaultPatientId]);

  // ── Reset when duration changes ──
  const handleDurationChange = (d: number) => {
    setDuration(d);
    setSelectedDay(null);
    setSelectedTime(null);
  };

  // ── Mutation ──
  const createMutation = useMutation({
    mutationFn: (data: {
      patientId: string;
      scheduledAt: string;
      duration: number;
      isOnline?: boolean;
      paymentMode?: 'none' | 'prepayment' | 'post_session';
      paymentAmount?: number;
      reason?: string;
      participantIds?: string[];
    }) => {
      if (data.isOnline && data.participantIds && data.participantIds.length > 0) {
        return appointmentsApi.createGroup(
          {
            patientId: data.patientId,
            participantIds: data.participantIds,
            scheduledAt: data.scheduledAt,
            duration: data.duration,
          },
          session?.accessToken ?? '',
        );
      }
      return appointmentsApi.create(
        {
          patientId: data.patientId,
          scheduledAt: data.scheduledAt,
          duration: data.duration,
          isOnline: data.isOnline,
          paymentMode: data.paymentMode !== 'none' ? data.paymentMode : undefined,
          paymentAmount: data.paymentAmount,
          reason: data.reason || undefined,
        },
        session?.accessToken ?? '',
      );
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['appointments'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      if (variables.participantIds && variables.participantIds.length > 0) {
        const total = variables.participantIds.length + 1;
        success(`RDV groupe planifié avec ${total} participants`);
      } else if (variables.paymentMode === 'prepayment') {
        success(`RDV créé — lien de paiement envoyé${selectedPatient ? ` à ${selectedPatient.name}` : ''}`);
      } else if (variables.paymentMode === 'post_session') {
        success(`RDV planifié${selectedPatient ? ` avec ${selectedPatient.name}` : ''} — vous enverrez le lien après la séance`);
      } else {
        success(`RDV planifié${selectedPatient ? ` avec ${selectedPatient.name}` : ''}`);
      }
      handleClose();
    },
    onError: (e: Error) => {
      showError(e.message || 'Erreur lors de la création du RDV');
    },
  });

  // ── Handlers ──
  const handleClose = () => {
    // Reset all state
    setStep(1);
    setPatientId('');
    setPatientSearch('');
    setDuration(50);
    setSelectedDay(null);
    setSelectedTime(null);
    setCurrentMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    setIsOnline(false);
    setParticipantIds([]);
    setPaymentMode('none');
    setPaymentAmount('');
    setReason('');
    setFormError(null);
    closeSmartSlotPicker();
  };

  const handleNextStep = () => {
    if (!patientId || !selectedDay || !selectedTime) return;
    setFormError(null);
    setStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !selectedDay || !selectedTime) {
      setFormError('Sélectionnez un patient et un créneau');
      return;
    }
    const scheduledAt = parisToUtcIso(selectedDay, selectedTime);
    const amount =
      paymentMode !== 'none' && paymentAmount ? Number(paymentAmount) : undefined;
    setFormError(null);
    createMutation.mutate({
      patientId,
      scheduledAt,
      duration,
      isOnline,
      paymentMode,
      paymentAmount: amount,
      reason: reason.trim() || undefined,
      participantIds: isOnline && participantIds.length > 0 ? participantIds : undefined,
    });
  };

  const canGoNext = !!patientId && !!selectedDay && !!selectedTime;

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <Dialog
      open={smartSlotPickerOpen}
      onClose={handleClose}
      title={step === 1 ? 'Planifier un rendez-vous' : 'Options du rendez-vous'}
      className="max-w-2xl"
    >
      {step === 1 ? (
        <Step1
          patients={filteredPatients}
          patientSearch={patientSearch}
          setPatientSearch={setPatientSearch}
          patientId={patientId}
          setPatientId={(id) => { setPatientId(id); setParticipantIds([]); }}
          selectedPatient={selectedPatient ?? null}
          duration={duration}
          setDuration={handleDurationChange}
          currentMonth={currentMonth}
          setCurrentMonth={setCurrentMonth}
          availableDays={availableDays}
          selectedDay={selectedDay}
          setSelectedDay={(day) => { setSelectedDay(day); setSelectedTime(null); }}
          slotsForSelectedDay={slotsForSelectedDay}
          selectedTime={selectedTime}
          setSelectedTime={setSelectedTime}
          selectedDayLabel={selectedDayLabel}
          slotSummary={slotSummary}
          slotsLoading={slotsLoading}
          slotsError={slotsError}
          onRetry={() => void refetchSlots()}
          canGoNext={canGoNext}
          onNext={handleNextStep}
          onClose={handleClose}
        />
      ) : (
        <form onSubmit={handleSubmit}>
          <Step2
            selectedPatient={selectedPatient ?? null}
            slotSummary={slotSummary}
            onModify={() => setStep(1)}
            patients={patients}
            patientId={patientId}
            isOnline={isOnline}
            setIsOnline={(v) => { setIsOnline(v); if (!v) setParticipantIds([]); }}
            participantIds={participantIds}
            setParticipantIds={setParticipantIds}
            paymentMode={paymentMode}
            setPaymentMode={(mode) => {
              setPaymentMode(mode);
              if (mode !== 'none' && !paymentAmount && psyProfile?.defaultSessionRate) {
                setPaymentAmount(String(psyProfile.defaultSessionRate));
              }
            }}
            paymentAmount={paymentAmount}
            setPaymentAmount={setPaymentAmount}
            canRequestPayment={canRequestPayment}
            reason={reason}
            setReason={setReason}
            formError={formError}
            isSubmitting={createMutation.isPending}
            onBack={() => setStep(1)}
            onClose={handleClose}
          />
        </form>
      )}
    </Dialog>
  );
}

// ─── Step 1 ─────────────────────────────────────────────────────────────────

interface Step1Props {
  patients: Array<{ id: string; name: string }>;
  patientSearch: string;
  setPatientSearch: (v: string) => void;
  patientId: string;
  setPatientId: (id: string) => void;
  selectedPatient: { id: string; name: string } | null;
  duration: number;
  setDuration: (d: number) => void;
  currentMonth: Date;
  setCurrentMonth: (m: Date) => void;
  availableDays: Set<string>;
  selectedDay: string | null;
  setSelectedDay: (d: string) => void;
  slotsForSelectedDay: string[];
  selectedTime: string | null;
  setSelectedTime: (t: string) => void;
  selectedDayLabel: string;
  slotSummary: string | null;
  slotsLoading: boolean;
  slotsError: boolean;
  onRetry: () => void;
  canGoNext: boolean;
  onNext: () => void;
  onClose: () => void;
}

function Step1({
  patients,
  patientSearch,
  setPatientSearch,
  patientId,
  setPatientId,
  selectedPatient,
  duration,
  setDuration,
  currentMonth,
  setCurrentMonth,
  availableDays,
  selectedDay,
  setSelectedDay,
  slotsForSelectedDay,
  selectedTime,
  setSelectedTime,
  selectedDayLabel,
  slotSummary,
  slotsLoading,
  slotsError,
  onRetry,
  canGoNext,
  onNext,
  onClose,
}: Step1Props) {
  const prevMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  return (
    <div className="space-y-5">
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
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                autoFocus
              />
            </div>
            <div className="max-h-36 overflow-y-auto rounded-lg border border-border">
              {patients.length === 0 ? (
                <p className="text-xs text-muted-foreground p-3 text-center">
                  Aucun patient trouvé
                </p>
              ) : (
                patients.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setPatientId(p.id); setPatientSearch(''); }}
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

      {/* Duration pills */}
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

      {/* Calendar + Time slots */}
      {slotsError ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">
            Impossible de charger les créneaux disponibles
          </p>
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            <RotateCcw size={14} />
            Réessayer
          </Button>
        </div>
      ) : !slotsLoading && availableDays.size === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <Calendar className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Aucun créneau disponible
          </p>
          <Link
            href="/dashboard/calendar"
            onClick={onClose}
            className="text-sm text-primary hover:underline"
          >
            Configurez vos disponibilités
          </Link>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-5">
          <MiniCalendar
            currentMonth={currentMonth}
            availableDays={availableDays}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            onPrevMonth={prevMonth}
            onNextMonth={nextMonth}
          />
          <TimeSlotPills
            dayLabel={selectedDayLabel}
            slots={slotsForSelectedDay}
            selectedTime={selectedTime}
            onSelect={setSelectedTime}
            isLoading={slotsLoading}
          />
        </div>
      )}

      {/* Selection summary */}
      {slotSummary && (
        <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-2.5 text-sm text-primary font-medium">
          {slotSummary}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-1">
        <Button type="button" variant="outline" onClick={onClose}>
          Annuler
        </Button>
        <Button
          type="button"
          disabled={!canGoNext}
          onClick={onNext}
        >
          Suivant →
        </Button>
      </div>
    </div>
  );
}

// ─── Step 2 ─────────────────────────────────────────────────────────────────

interface Step2Props {
  selectedPatient: { id: string; name: string } | null;
  slotSummary: string | null;
  onModify: () => void;
  patients: Array<{ id: string; name: string }>;
  patientId: string;
  isOnline: boolean;
  setIsOnline: (v: boolean) => void;
  participantIds: string[];
  setParticipantIds: (ids: string[]) => void;
  paymentMode: 'none' | 'prepayment' | 'post_session';
  setPaymentMode: (mode: 'none' | 'prepayment' | 'post_session') => void;
  paymentAmount: string;
  setPaymentAmount: (v: string) => void;
  canRequestPayment: boolean;
  reason: string;
  setReason: (v: string) => void;
  formError: string | null;
  isSubmitting: boolean;
  onBack: () => void;
  onClose: () => void;
}

function Step2({
  selectedPatient,
  slotSummary,
  onModify,
  patients,
  patientId,
  isOnline,
  setIsOnline,
  participantIds,
  setParticipantIds,
  paymentMode,
  setPaymentMode,
  paymentAmount,
  setPaymentAmount,
  canRequestPayment,
  reason,
  setReason,
  formError,
  isSubmitting,
  onBack,
  onClose,
}: Step2Props) {
  return (
    <div className="space-y-5">
      {/* Recap bar */}
      <div className="flex items-center justify-between rounded-lg bg-surface border border-border px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Patient avatar (initials) */}
          {selectedPatient && (
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center flex-shrink-0">
              {selectedPatient.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-foreground">
              {selectedPatient?.name ?? '—'}
            </p>
            {slotSummary && (
              <p className="text-xs text-muted-foreground">{slotSummary}</p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onModify}
          className="text-xs text-primary hover:underline"
        >
          Modifier
        </button>
      </div>

      {/* Mode de consultation */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Mode de consultation</label>
        <div className="flex rounded-lg border border-border overflow-hidden text-sm">
          <button
            type="button"
            onClick={() => setIsOnline(false)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2 font-medium transition',
              !isOnline
                ? 'bg-primary text-white'
                : 'bg-white text-muted-foreground hover:bg-surface',
            )}
          >
            <MapPin className="h-4 w-4" />
            Au cabinet
          </button>
          <button
            type="button"
            onClick={() => setIsOnline(true)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2 font-medium transition',
              isOnline
                ? 'bg-primary text-white'
                : 'bg-white text-muted-foreground hover:bg-surface',
            )}
          >
            <Video className="h-4 w-4" />
            En visio
          </button>
        </div>
      </div>

      {/* Group participants (visio only) */}
      {isOnline && patientId && (
        <div className="space-y-2 ml-6">
          <label className="text-sm font-medium text-foreground">
            Participants supplémentaires (optionnel)
          </label>
          <ParticipantMultiSelect
            patients={patients}
            excludePatientId={patientId}
            selected={participantIds}
            onChange={setParticipantIds}
          />
        </div>
      )}

      {/* Payment mode */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
          <CreditCard className="h-4 w-4" />
          Paiement en ligne
        </label>
        {!canRequestPayment ? (
          <p className="text-xs text-muted-foreground/70 ml-5">
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
                onChange={() => setPaymentMode('prepayment')}
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
                onChange={() => setPaymentMode('post_session')}
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

      {/* Reason / notes */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground" htmlFor="reason">
          Motif de consultation <span className="text-muted-foreground font-normal">(optionnel)</span>
        </label>
        <textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={2000}
          rows={3}
          placeholder="Décrivez brièvement le motif..."
          className={cn(
            'flex w-full rounded-lg border border-input bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
          )}
        />
        {reason.length > 1800 && (
          <p className="text-xs text-muted-foreground text-right">
            {reason.length}/2000 caractères
          </p>
        )}
      </div>

      {formError && (
        <p className="text-sm text-destructive" role="alert">{formError}</p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-1">
        <Button type="button" variant="ghost" onClick={onBack}>
          <ArrowLeft size={16} />
          Retour
        </Button>
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Planifier la séance
          </Button>
        </div>
      </div>
    </div>
  );
}
