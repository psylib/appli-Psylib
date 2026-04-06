'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
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
  paidOnline?: boolean;
  bookingPaymentStatus?: 'none' | 'pending_payment' | 'paid' | 'payment_failed';
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

interface AppointmentsResponse {
  data: Appointment[];
  total: number;
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

export function CalendarContent() {
  const { data: session } = useSession();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [view, setView] = useState<'month' | 'week'>('month');

  const { year, month } = currentMonth;

  // Fetch appointments for the current month
  const startDate = new Date(year, month, 1).toISOString();
  const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

  const queryClient = useQueryClient();

  const { data: appointmentsData, isLoading } = useQuery({
    queryKey: ['appointments', year, month],
    queryFn: () =>
      apiClient.get<AppointmentsResponse>(
        `/appointments?startDate=${startDate}&endDate=${endDate}&limit=200`,
        session?.accessToken,
      ),
    enabled: !!session?.accessToken,
  });

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
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const appointments = appointmentsData?.data ?? [];

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

  const prevMonth = () => {
    setCurrentMonth(({ year, month }) => {
      if (month === 0) return { year: year - 1, month: 11 };
      return { year, month: month - 1 };
    });
  };

  const nextMonth = () => {
    setCurrentMonth(({ year, month }) => {
      if (month === 11) return { year: year + 1, month: 0 };
      return { year, month: month + 1 };
    });
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendrier</h1>
          <p className="text-muted-foreground mt-1">Gérez vos rendez-vous et séances</p>
        </div>
        <Button size="sm" onClick={() => setShowCreateDialog(true)}>
          <Plus size={16} />
          Nouveau RDV
        </Button>
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
            {/* Navigation mois */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg hover:bg-surface transition-colors"
                aria-label="Mois précédent"
              >
                <ChevronLeft size={18} className="text-muted-foreground" />
              </button>
              <h2 className="text-sm font-semibold text-foreground">
                {MONTHS[month]} {year}
              </h2>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg hover:bg-surface transition-colors"
                aria-label="Mois suivant"
              >
                <ChevronRight size={18} className="text-muted-foreground" />
              </button>
            </div>

            {/* Jours de la semaine */}
            <div className="grid grid-cols-7 border-b border-border">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="py-2 text-center text-xs font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Grille calendrier */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, i) => {
                if (day === null) {
                  return <div key={`empty-${i}`} className="h-14 border-b border-r border-border/50 last:border-r-0" />;
                }

                const date = new Date(year, month, day);
                const isToday = isSameDay(date, today);
                const isSelected = isSameDay(date, selectedDate);
                const dayAppts = appointmentsByDate.get(date.toDateString()) ?? [];
                const hasAppts = dayAppts.length > 0;

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(date)}
                    className={cn(
                      'h-14 p-1.5 text-left border-b border-r border-border/50 hover:bg-surface transition-colors relative',
                      (i + 1) % 7 === 0 && 'border-r-0',
                      isSelected && 'bg-primary/5',
                    )}
                  >
                    <span
                      className={cn(
                        'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full',
                        isToday && 'bg-primary text-white',
                        !isToday && isSelected && 'text-primary font-bold',
                        !isToday && !isSelected && 'text-foreground',
                      )}
                    >
                      {day}
                    </span>
                    {hasAppts && (
                      <div className="flex gap-0.5 mt-0.5 flex-wrap">
                        {dayAppts.slice(0, 3).map((appt) => (
                          <div
                            key={appt.id}
                            className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0"
                            title={appt.patient.name}
                          />
                        ))}
                        {dayAppts.length > 3 && (
                          <span className="text-[9px] text-muted-foreground">+{dayAppts.length - 3}</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
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
          ) : selectedDateAppointments.length === 0 ? (
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
                          <button
                            onClick={() => setCancelTarget(appt)}
                            className="text-xs text-destructive hover:underline"
                          >
                            Annuler
                          </button>
                        )}
                      </div>

                      {/* Payment actions */}
                      {(appt.status === 'scheduled' || appt.status === 'confirmed' || appt.status === 'completed') && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <PaymentActions appointment={appt} compact />
                        </div>
                      )}
                    </div>
                  );
                })}
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
