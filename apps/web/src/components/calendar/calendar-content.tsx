'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Bell,
  Video,
  Settings2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { CreateAppointmentDialog } from '@/components/calendar/create-appointment-dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { appointmentsApi } from '@/lib/api/appointments';
import type { PendingAppointment } from '@/lib/api/appointments';
import { PaymentActions } from '@/components/billing/payment-actions';
import { cn } from '@/lib/utils';

interface Appointment {
  id: string;
  scheduledAt: string;
  duration: number;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  isOnline?: boolean;
  paidOnline?: boolean;
  bookingPaymentStatus?: 'none' | 'pending_payment' | 'paid' | 'payment_failed';
  paymentMode?: 'none' | 'prepayment' | 'post_session';
  paymentAmount?: number | null;
  patient: {
    id: string;
    name: string;
  };
  consultationType?: {
    id: string;
    name: string;
    color: string;
  } | null;
}

const STATUS_CONFIG = {
  scheduled: { label: 'Planifié', color: 'bg-blue-100 text-blue-700', icon: Clock },
  confirmed: { label: 'Confirmé', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  cancelled: { label: 'Annulé', color: 'bg-red-100 text-red-600', icon: XCircle },
  completed: { label: 'Terminé', color: 'bg-gray-100 text-gray-600', icon: CheckCircle2 },
  no_show: { label: 'Absent', color: 'bg-amber-100 text-amber-700', icon: AlertCircle },
} as const;

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  // Monday = 0, Sunday = 6
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function isWithinVideoWindow(scheduledAt: string): boolean {
  const scheduled = new Date(scheduledAt);
  const now = new Date();
  const windowStart = new Date(scheduled.getTime() - 10 * 60 * 1000);
  return now >= windowStart;
}

const HOUR_HEIGHT = 60;
const START_HOUR = 7;
const END_HOUR = 21;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);

function getWeekDates(date: Date): Date[] {
  const d = new Date(date);
  const dayOfWeek = d.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const result = new Date(monday);
    result.setDate(monday.getDate() + i);
    return result;
  });
}

function getAppointmentStyle(scheduledAt: string, duration: number): { top: number; height: number } | null {
  const date = new Date(scheduledAt);
  const totalMinutes = date.getHours() * 60 + date.getMinutes();
  const startMinutes = START_HOUR * 60;
  const endMinutes = END_HOUR * 60;
  const visibleStart = Math.max(totalMinutes, startMinutes);
  const visibleEnd = Math.min(totalMinutes + duration, endMinutes);
  if (visibleStart >= visibleEnd) return null;
  const top = ((visibleStart - startMinutes) / 60) * HOUR_HEIGHT;
  const height = Math.max(((visibleEnd - visibleStart) / 60) * HOUR_HEIGHT, 22);
  return { top, height };
}

function NowIndicator() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);
  const h = now.getHours();
  const m = now.getMinutes();
  if (h < START_HOUR || h >= END_HOUR) return null;
  const top = (h - START_HOUR + m / 60) * HOUR_HEIGHT;
  return (
    <div className="absolute left-0 right-0 z-10 pointer-events-none" style={{ top }}>
      <div className="w-2 h-2 rounded-full bg-red-500 absolute -left-1 -top-1" />
      <div className="h-px bg-red-500 w-full" />
    </div>
  );
}

export function CalendarContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const timeGridRef = useRef<HTMLDivElement>(null);

  const { year, month } = currentMonth;

  // Fetch range: pad by 7 days to cover weeks spanning month boundaries
  const fetchFrom = new Date(year, month, 1);
  fetchFrom.setDate(fetchFrom.getDate() - 7);
  const fetchTo = new Date(year, month + 1, 0, 23, 59, 59);
  fetchTo.setDate(fetchTo.getDate() + 7);
  const from = fetchFrom.toISOString();
  const to = fetchTo.toISOString();

  const queryClient = useQueryClient();

  const { data: appointmentsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['appointments', year, month],
    queryFn: () =>
      apiClient.get<Appointment[]>(
        `/appointments?from=${from}&to=${to}&limit=100`,
        session?.accessToken,
      ),
    enabled: !!session?.accessToken,
  });

  const { data: externalEvents = [] } = useQuery({
    queryKey: ['external-calendar-events', year, month],
    queryFn: () =>
      apiClient.get<Array<{
        id: string;
        title: string | null;
        startAt: string;
        endAt: string;
        isAllDay: boolean;
      }>>(
        `/calendar-sync/external-events?from=${from}&to=${to}`,
        session?.accessToken,
      ),
    enabled: !!session?.accessToken,
  });

  // Fetch availability slots to show which days have configured availability
  const { data: availabilitySlots = [] } = useQuery({
    queryKey: ['availability'],
    queryFn: () =>
      apiClient.get<Array<{ dayOfWeek: number; startTime: string; endTime: string; isActive: boolean }>>(
        '/availability',
        session?.accessToken,
      ),
    enabled: !!session?.accessToken,
  });

  // Build a set of active days-of-week (0=Mon..6=Sun)
  const activeDays = new Set(
    availabilitySlots.filter((s) => s.isActive).map((s) => s.dayOfWeek),
  );

  const { data: pendingAppointments = [] } = useQuery({
    queryKey: ['appointments', 'pending'],
    queryFn: () => appointmentsApi.getPending(session?.accessToken ?? ''),
    enabled: !!session?.accessToken,
    refetchInterval: 60000, // rafraîchit toutes les minutes
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => appointmentsApi.confirm(id, session?.accessToken ?? ''),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  const declineMutation = useMutation({
    mutationFn: (id: string) => appointmentsApi.decline(id, session?.accessToken ?? ''),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => appointmentsApi.cancel(id, session?.accessToken ?? ''),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setCancelTarget(null);
    },
  });

  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [noShowTarget, setNoShowTarget] = useState<Appointment | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const noShowMutation = useMutation({
    mutationFn: (id: string) => appointmentsApi.update(id, { status: 'no_show' }, session?.accessToken ?? ''),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setNoShowTarget(null);
    },
  });

  const appointments = appointmentsData ?? [];

  // Sync currentMonth with selectedDate for week/day views
  useEffect(() => {
    if (view !== 'month') {
      setCurrentMonth(prev => {
        const m = selectedDate.getMonth();
        const y = selectedDate.getFullYear();
        if (m !== prev.month || y !== prev.year) return { year: y, month: m };
        return prev;
      });
    }
  }, [selectedDate, view]);

  // Scroll time grid to 8am on view change
  useEffect(() => {
    if (timeGridRef.current && view !== 'month') {
      timeGridRef.current.scrollTop = (8 - START_HOUR) * HOUR_HEIGHT;
    }
  }, [view]);

  // Week dates for week view
  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);

  // Header label based on view
  const headerLabel = useMemo(() => {
    if (view === 'month') return `${MONTHS[month]} ${year}`;
    if (view === 'week') {
      const start = weekDates[0]!;
      const end = weekDates[6]!;
      if (start.getMonth() === end.getMonth()) {
        return `${start.getDate()} – ${end.getDate()} ${MONTHS[start.getMonth()]} ${start.getFullYear()}`;
      }
      return `${start.getDate()} ${MONTHS[start.getMonth()]!.slice(0, 3)} – ${end.getDate()} ${MONTHS[end.getMonth()]!.slice(0, 3)} ${end.getFullYear()}`;
    }
    return selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }, [view, month, year, selectedDate, weekDates]);

  if (isError) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p>Une erreur est survenue lors du chargement des données.</p>
        <button onClick={() => refetch()} className="mt-2 text-primary underline">
          Réessayer
        </button>
      </div>
    );
  }

  // Group appointments by date
  const appointmentsByDate = new Map<string, Appointment[]>();
  for (const appt of appointments) {
    const key = new Date(appt.scheduledAt).toDateString();
    if (!appointmentsByDate.has(key)) {
      appointmentsByDate.set(key, []);
    }
    appointmentsByDate.get(key)!.push(appt);
  }

  // Selected date appointments
  const selectedDateAppointments = appointmentsByDate.get(selectedDate.toDateString()) ?? [];

  // Navigation
  const navigatePrev = () => {
    if (view === 'month') {
      setCurrentMonth(({ year, month }) =>
        month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
      );
    } else if (view === 'week') {
      setSelectedDate(prev => { const d = new Date(prev); d.setDate(d.getDate() - 7); return d; });
    } else {
      setSelectedDate(prev => { const d = new Date(prev); d.setDate(d.getDate() - 1); return d; });
    }
  };

  const navigateNext = () => {
    if (view === 'month') {
      setCurrentMonth(({ year, month }) =>
        month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
      );
    } else if (view === 'week') {
      setSelectedDate(prev => { const d = new Date(prev); d.setDate(d.getDate() + 7); return d; });
    } else {
      setSelectedDate(prev => { const d = new Date(prev); d.setDate(d.getDate() + 1); return d; });
    }
  };

  const goToToday = () => {
    const t = new Date();
    setSelectedDate(t);
    setCurrentMonth({ year: t.getFullYear(), month: t.getMonth() });
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Build calendar grid
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);
  // Pad to full weeks
  while (calendarDays.length % 7 !== 0) calendarDays.push(null);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendrier</h1>
          <p className="text-muted-foreground mt-1">Gérez vos rendez-vous et séances</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* View toggle */}
          <div className="inline-flex items-center rounded-lg border border-border bg-surface p-0.5">
            {(['day', 'week', 'month'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                  view === v ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {v === 'day' ? 'Jour' : v === 'week' ? 'Semaine' : 'Mois'}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/settings/practice')}
          >
            <Settings2 size={14} />
            Disponibilités
          </Button>
          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus size={16} />
            Nouveau RDV
          </Button>
        </div>
      </div>

      {/* Demandes en attente */}
      {pendingAppointments.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bell size={16} className="text-amber-600" />
            <h2 className="text-sm font-semibold text-amber-800">
              Demandes en attente ({pendingAppointments.length})
            </h2>
          </div>
          <div className="space-y-2">
            {pendingAppointments.map((appt: PendingAppointment) => {
              const date = new Date(appt.scheduledAt);
              const dateStr = date.toLocaleDateString('fr-FR', {
                weekday: 'long', day: 'numeric', month: 'long',
              });
              const timeStr = date.toLocaleTimeString('fr-FR', {
                hour: '2-digit', minute: '2-digit',
              });
              return (
                <div
                  key={appt.id}
                  className="bg-white rounded-lg border border-amber-200 p-3 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{appt.patient.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                      {dateStr} à {timeStr} · {appt.duration} min
                    </p>
                    {appt.reason && (
                      <p className="text-xs text-muted-foreground mt-0.5 italic truncate max-w-xs">
                        {appt.reason}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => confirmMutation.mutate(appt.id)}
                      disabled={confirmMutation.isPending || declineMutation.isPending}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                    >
                      <CheckCircle2 size={12} />
                      Confirmer
                    </button>
                    <button
                      onClick={() => declineMutation.mutate(appt.id)}
                      disabled={confirmMutation.isPending || declineMutation.isPending}
                      className="flex items-center gap-1 px-3 py-1.5 bg-white border border-red-300 text-red-600 text-xs font-medium rounded-lg hover:bg-red-50 disabled:opacity-50 transition"
                    >
                      <XCircle size={12} />
                      Refuser
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendrier */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-white overflow-hidden">
            {/* Navigation */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <button
                onClick={navigatePrev}
                className="p-1.5 rounded-lg hover:bg-surface transition-colors"
                aria-label="Précédent"
              >
                <ChevronLeft size={18} className="text-muted-foreground" />
              </button>
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold text-foreground capitalize">{headerLabel}</h2>
                {!isSameDay(selectedDate, today) && (
                  <button
                    onClick={goToToday}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Aujourd&apos;hui
                  </button>
                )}
              </div>
              <button
                onClick={navigateNext}
                className="p-1.5 rounded-lg hover:bg-surface transition-colors"
                aria-label="Suivant"
              >
                <ChevronRight size={18} className="text-muted-foreground" />
              </button>
            </div>

            {/* === MONTH VIEW === */}
            {view === 'month' && (
              <>
                <div className="grid grid-cols-7 border-b border-border">
                  {WEEKDAYS.map((day) => (
                    <div key={day} className="py-2 text-center text-xs font-medium text-muted-foreground">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {calendarDays.map((day, i) => {
                    if (day === null) {
                      return <div key={`empty-${i}`} className="h-14 border-b border-r border-border/50 last:border-r-0" />;
                    }
                    const date = new Date(year, month, day);
                    const isToday_ = isSameDay(date, today);
                    const isSelected_ = isSameDay(date, selectedDate);
                    const dayAppts = appointmentsByDate.get(date.toDateString()) ?? [];
                    const hasAppts = dayAppts.length > 0;
                    const jsDay = date.getDay();
                    const ourDayOfWeek = jsDay === 0 ? 6 : jsDay - 1;
                    const hasAvailability = activeDays.has(ourDayOfWeek);
                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDate(date)}
                        className={cn(
                          'h-14 p-1.5 text-left border-b border-r border-border/50 hover:bg-surface transition-colors relative',
                          (i + 1) % 7 === 0 && 'border-r-0',
                          isSelected_ && 'bg-primary/5',
                          hasAvailability && !isSelected_ && 'bg-emerald-50/40',
                        )}
                      >
                        <span className={cn(
                          'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full',
                          isToday_ && 'bg-primary text-white',
                          !isToday_ && isSelected_ && 'text-primary font-bold',
                          !isToday_ && !isSelected_ && 'text-foreground',
                        )}>
                          {day}
                        </span>
                        {(hasAppts || externalEvents.some(e => isSameDay(new Date(e.startAt), date))) && (
                          <div className="flex gap-0.5 mt-0.5 flex-wrap">
                            {dayAppts.slice(0, 3).map((appt) => (
                              <div key={appt.id} className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" title={appt.patient.name} />
                            ))}
                            {dayAppts.length > 3 && (
                              <span className="text-[9px] text-muted-foreground">+{dayAppts.length - 3}</span>
                            )}
                            {externalEvents
                              .filter(e => isSameDay(new Date(e.startAt), date))
                              .slice(0, 2)
                              .map(e => (
                                <div key={`ext-${e.id}`} className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" title={`Google: ${e.title || 'Occupé'}`} />
                              ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* === WEEK VIEW === */}
            {view === 'week' && (
              <>
                {/* Week day headers */}
                <div className="grid border-b border-border" style={{ gridTemplateColumns: '50px repeat(7, 1fr)' }}>
                  <div className="py-2" />
                  {weekDates.map((date, i) => {
                    const isToday_ = isSameDay(date, today);
                    const isSelected_ = isSameDay(date, selectedDate);
                    const jsDay = date.getDay();
                    const ourDow = jsDay === 0 ? 6 : jsDay - 1;
                    const hasAvail = activeDays.has(ourDow);
                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedDate(date)}
                        className={cn(
                          'py-2 text-center border-l border-border/50 transition-colors',
                          isSelected_ && 'bg-primary/5',
                          hasAvail && !isSelected_ && 'bg-emerald-50/40',
                        )}
                      >
                        <span className="text-[10px] text-muted-foreground block">{WEEKDAYS[i]}</span>
                        <span className={cn(
                          'text-sm font-medium inline-flex items-center justify-center w-7 h-7 rounded-full',
                          isToday_ && 'bg-primary text-white',
                          !isToday_ && isSelected_ && 'text-primary font-bold',
                        )}>
                          {date.getDate()}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {/* Time grid */}
                <div ref={timeGridRef} className="overflow-y-auto overflow-x-auto" style={{ maxHeight: 600 }}>
                  <div className="flex" style={{ minWidth: 600 }}>
                    {/* Hour labels */}
                    <div className="w-[50px] flex-shrink-0 relative" style={{ height: (END_HOUR - START_HOUR) * HOUR_HEIGHT }}>
                      {HOURS.map(hour => (
                        <div key={hour} className="absolute right-2 text-[11px] text-muted-foreground" style={{ top: (hour - START_HOUR) * HOUR_HEIGHT - 6 }}>
                          {hour}h
                        </div>
                      ))}
                    </div>
                    {/* Day columns */}
                    <div className="flex-1 grid grid-cols-7 relative">
                      {/* Hour lines */}
                      {HOURS.map(hour => (
                        <div key={`line-${hour}`} className="absolute left-0 right-0 border-t border-border/30" style={{ top: (hour - START_HOUR) * HOUR_HEIGHT }} />
                      ))}
                      {HOURS.map(hour => (
                        <div key={`half-${hour}`} className="absolute left-0 right-0 border-t border-border/10" style={{ top: (hour - START_HOUR + 0.5) * HOUR_HEIGHT }} />
                      ))}
                      {/* Columns */}
                      {weekDates.map((date, colIdx) => {
                        const dayAppts = appointmentsByDate.get(date.toDateString()) ?? [];
                        const dayExternal = externalEvents.filter(e => !e.isAllDay && isSameDay(new Date(e.startAt), date));
                        return (
                          <div
                            key={colIdx}
                            className={cn('relative border-l border-border/30', colIdx === 0 && 'border-l-0')}
                            style={{ height: (END_HOUR - START_HOUR) * HOUR_HEIGHT }}
                          >
                            {dayAppts.map(appt => {
                              const pos = getAppointmentStyle(appt.scheduledAt, appt.duration);
                              if (!pos) return null;
                              const time = new Date(appt.scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                              return (
                                <button
                                  key={appt.id}
                                  onClick={() => setSelectedDate(date)}
                                  className={cn(
                                    'absolute left-0.5 right-0.5 rounded-md px-1 py-0.5 text-left overflow-hidden text-[11px] leading-tight transition-colors',
                                    appt.status === 'cancelled' && 'bg-red-50 border border-red-200/60 text-red-400 line-through',
                                    appt.status === 'completed' && 'bg-gray-50 border border-gray-200/60 text-gray-500',
                                    appt.status === 'no_show' && 'bg-amber-50 border border-amber-200/60 text-amber-600',
                                    (appt.status === 'scheduled' || appt.status === 'confirmed') && 'bg-primary/10 border border-primary/20 text-foreground hover:bg-primary/15',
                                  )}
                                  style={{ top: pos.top, height: pos.height }}
                                  title={`${appt.patient.name} · ${time} · ${appt.duration}min`}
                                >
                                  <span className="font-medium truncate block">{appt.patient.name}</span>
                                  {pos.height > 30 && <span className="text-muted-foreground">{time}</span>}
                                </button>
                              );
                            })}
                            {dayExternal.map(evt => {
                              const start = new Date(evt.startAt);
                              const end = new Date(evt.endAt);
                              const dur = Math.max((end.getTime() - start.getTime()) / 60000, 15);
                              const pos = getAppointmentStyle(evt.startAt, dur);
                              if (!pos) return null;
                              return (
                                <div
                                  key={`ext-${evt.id}`}
                                  className="absolute left-0.5 right-0.5 rounded-md px-1 py-0.5 bg-gray-100 border border-gray-200/60 text-[11px] text-gray-500 overflow-hidden"
                                  style={{ top: pos.top, height: pos.height }}
                                  title={`Google: ${evt.title || 'Occupé'}`}
                                >
                                  <span className="truncate block">{evt.title || 'Occupé'}</span>
                                </div>
                              );
                            })}
                            {isSameDay(date, today) && <NowIndicator />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* === DAY VIEW === */}
            {view === 'day' && (() => {
              const dayAppts = appointmentsByDate.get(selectedDate.toDateString()) ?? [];
              const dayExternal = externalEvents.filter(e => !e.isAllDay && isSameDay(new Date(e.startAt), selectedDate));
              return (
                <div ref={timeGridRef} className="overflow-y-auto" style={{ maxHeight: 600 }}>
                  <div className="flex">
                    {/* Hour labels */}
                    <div className="w-[50px] flex-shrink-0 relative" style={{ height: (END_HOUR - START_HOUR) * HOUR_HEIGHT }}>
                      {HOURS.map(hour => (
                        <div key={hour} className="absolute right-2 text-[11px] text-muted-foreground" style={{ top: (hour - START_HOUR) * HOUR_HEIGHT - 6 }}>
                          {hour}h
                        </div>
                      ))}
                    </div>
                    {/* Day column */}
                    <div className="flex-1 relative" style={{ height: (END_HOUR - START_HOUR) * HOUR_HEIGHT }}>
                      {HOURS.map(hour => (
                        <div key={`line-${hour}`} className="absolute left-0 right-0 border-t border-border/30" style={{ top: (hour - START_HOUR) * HOUR_HEIGHT }} />
                      ))}
                      {HOURS.map(hour => (
                        <div key={`half-${hour}`} className="absolute left-0 right-0 border-t border-border/10" style={{ top: (hour - START_HOUR + 0.5) * HOUR_HEIGHT }} />
                      ))}
                      {dayAppts.map(appt => {
                        const pos = getAppointmentStyle(appt.scheduledAt, appt.duration);
                        if (!pos) return null;
                        const time = new Date(appt.scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                        const config = STATUS_CONFIG[appt.status];
                        const StatusIcon = config.icon;
                        return (
                          <div
                            key={appt.id}
                            className={cn(
                              'absolute left-1 right-1 rounded-lg px-2.5 py-1.5 text-left overflow-hidden transition-colors',
                              appt.status === 'cancelled' && 'bg-red-50 border border-red-200/60 text-red-400',
                              appt.status === 'completed' && 'bg-gray-50 border border-gray-200/60 text-gray-600',
                              appt.status === 'no_show' && 'bg-amber-50 border border-amber-200/60 text-amber-700',
                              (appt.status === 'scheduled' || appt.status === 'confirmed') && 'bg-primary/10 border border-primary/20 text-foreground',
                            )}
                            style={{ top: pos.top, height: pos.height }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium truncate">{appt.patient.name}</span>
                              <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0', config.color)}>
                                <StatusIcon size={9} className="inline mr-0.5" />
                                {config.label}
                              </span>
                            </div>
                            {pos.height > 40 && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                <span>{time}</span>
                                <span>{appt.duration}min</span>
                                {appt.isOnline && (
                                  <span className="inline-flex items-center gap-0.5 text-accent">
                                    <Video className="h-3 w-3" /> Visio
                                  </span>
                                )}
                                {appt.consultationType && <span>{appt.consultationType.name}</span>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {dayExternal.map(evt => {
                        const start = new Date(evt.startAt);
                        const end = new Date(evt.endAt);
                        const dur = Math.max((end.getTime() - start.getTime()) / 60000, 15);
                        const pos = getAppointmentStyle(evt.startAt, dur);
                        if (!pos) return null;
                        return (
                          <div
                            key={`ext-${evt.id}`}
                            className="absolute left-1 right-1 rounded-lg px-2.5 py-1.5 bg-gray-100 border border-gray-200/60 text-sm text-gray-500 overflow-hidden"
                            style={{ top: pos.top, height: pos.height }}
                            title={`Google: ${evt.title || 'Occupé'}`}
                          >
                            <span className="truncate block">{evt.title || 'Occupé'}</span>
                          </div>
                        );
                      })}
                      {isSameDay(selectedDate, today) && <NowIndicator />}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Panel RDV du jour sélectionné */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {isSameDay(selectedDate, today) ? 'Aujourd\'hui' : (
                selectedDate.toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })
              )}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {selectedDateAppointments.length === 0
                ? 'Aucun rendez-vous'
                : `${selectedDateAppointments.length} rendez-vous`}
              {(() => {
                const selJsDay = selectedDate.getDay();
                const selOurDay = selJsDay === 0 ? 6 : selJsDay - 1;
                return activeDays.has(selOurDay)
                  ? ''
                  : ' · Pas de disponibilité configurée';
              })()}
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-xl border border-border p-4 animate-pulse">
                  <div className="h-3 bg-surface rounded w-2/3 mb-2" />
                  <div className="h-2 bg-surface rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : selectedDateAppointments.length === 0 && externalEvents.filter(e => isSameDay(new Date(e.startAt), selectedDate)).length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center">
              <Calendar size={24} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Pas de RDV ce jour</p>
              <button
                className="text-xs text-primary hover:underline mt-1"
                onClick={() => setShowCreateDialog(true)}
              >
                Planifier un RDV
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDateAppointments
                .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                .map((appt) => {
                  const config = STATUS_CONFIG[appt.status];
                  const StatusIcon = config.icon;
                  const time = new Date(appt.scheduledAt).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={appt.id}
                      className="rounded-xl border border-border bg-white p-4 hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <User size={14} className="text-muted-foreground flex-shrink-0" />
                          <span className="text-sm font-medium text-foreground truncate">
                            {appt.patient.name}
                          </span>
                        </div>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0', config.color)}>
                          <StatusIcon size={10} className="inline mr-1" />
                          {config.label}
                        </span>
                        {appt.isOnline && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                            <Video className="h-3 w-3" />
                            Visio
                          </span>
                        )}
                      </div>

                      {/* Consultation type + payment badges */}
                      {(appt.consultationType || appt.bookingPaymentStatus) && (
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {appt.consultationType && (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <span
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: appt.consultationType.color || '#3D52A0' }}
                                aria-hidden
                              />
                              {appt.consultationType.name}
                            </span>
                          )}
                          {appt.paidOnline ? (
                            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                              Payé en ligne
                            </span>
                          ) : appt.bookingPaymentStatus === 'pending_payment' ? (
                            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                              Paiement en attente
                            </span>
                          ) : appt.bookingPaymentStatus === 'payment_failed' ? (
                            <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700">
                              Paiement échoué
                            </span>
                          ) : appt.paymentMode === 'post_session' ? (
                            <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                              {appt.paymentAmount ? `${appt.paymentAmount}€ à envoyer` : 'Lien à envoyer'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                              Cabinet
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            {time}
                          </span>
                          <span>{appt.duration} min</span>
                        </div>
                        {(appt.status === 'scheduled' || appt.status === 'confirmed') && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setNoShowTarget(appt)}
                              className="text-xs text-amber-600 hover:underline"
                            >
                              Absent
                            </button>
                            <button
                              onClick={() => setCancelTarget(appt)}
                              className="text-xs text-destructive hover:underline"
                            >
                              Annuler
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Video call button */}
                      {appt.isOnline && isWithinVideoWindow(appt.scheduledAt) && appt.status !== 'completed' && (
                        <button
                          onClick={() => router.push(`/video/${appt.id}`)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent/90 transition-colors mt-2"
                        >
                          <Video className="h-3.5 w-3.5" />
                          Démarrer la visio
                        </button>
                      )}

                      {/* Payment actions */}
                      {(appt.status === 'scheduled' || appt.status === 'confirmed' || appt.status === 'completed') && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <PaymentActions appointment={appt} compact />
                        </div>
                      )}
                    </div>
                  );
                })}

              {/* External Google Calendar events */}
              {externalEvents
                .filter(e => isSameDay(new Date(e.startAt), selectedDate))
                .map(e => (
                  <div key={`ext-detail-${e.id}`} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-dashed border-gray-200">
                    <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-500 truncate">
                        {e.title || 'Occupé'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {e.isAllDay
                          ? 'Toute la journée'
                          : `${new Date(e.startAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - ${new Date(e.endAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
                      </p>
                    </div>
                    <span className="text-[10px] text-gray-400">Google</span>
                  </div>
                ))}
            </div>
          )}

          {/* Légende */}
          {availabilitySlots.length > 0 && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded border border-emerald-200 bg-emerald-50" />
                Jour avec disponibilités
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                RDV
              </span>
            </div>
          )}

          {availabilitySlots.length === 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
              Vous n&apos;avez pas encore configuré vos disponibilités.{' '}
              <button
                onClick={() => router.push('/dashboard/settings/practice')}
                className="underline font-medium"
              >
                Configurer maintenant
              </button>
            </div>
          )}

          {/* Stats du mois */}
          <div className="rounded-xl border border-border bg-surface p-4 mt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              {MONTHS[month]}
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-2xl font-bold text-foreground">{appointments.length}</p>
                <p className="text-xs text-muted-foreground">RDV total</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {appointments.filter((a) => a.status === 'completed').length}
                </p>
                <p className="text-xs text-muted-foreground">Réalisés</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create appointment dialog */}
      <CreateAppointmentDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        defaultDate={selectedDate}
      />

      {/* No-show confirmation dialog */}
      <ConfirmDialog
        open={!!noShowTarget}
        onClose={() => setNoShowTarget(null)}
        onConfirm={() => {
          if (noShowTarget) noShowMutation.mutate(noShowTarget.id);
        }}
        title="Marquer comme absent ?"
        description={
          noShowTarget
            ? `Le rendez-vous avec ${noShowTarget.patient.name} sera marque comme non honore. Si la facturation des absences est activee dans vos parametres, une facture sera automatiquement generee.`
            : ''
        }
        confirmLabel="Marquer absent"
        variant="destructive"
        loading={noShowMutation.isPending}
      />

      {/* Cancel appointment dialog */}
      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => {
          if (cancelTarget) cancelMutation.mutate(cancelTarget.id);
        }}
        title="Annuler ce rendez-vous ?"
        description={
          cancelTarget
            ? `Le rendez-vous avec ${cancelTarget.patient.name} sera annulé.`
            : ''
        }
        confirmLabel="Annuler le RDV"
        variant="destructive"
        loading={cancelMutation.isPending}
      />
    </div>
  );
}
