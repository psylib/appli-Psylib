# Smart Slot Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the "Nouvelle séance" flow with a 2-step dialog modal that shows available timeslots from the psychologist's agenda, creating an Appointment instead of a Session.

**Architecture:** New authenticated endpoint `GET /availability/timeslots` exposes the existing `getAvailableTimeslots()` service method. Frontend: Zustand store controls dialog open state, a `SmartSlotPickerDialog` component renders a mini-calendar + time slot pills in step 1, then appointment options (visio, payment, notes) in step 2. All "Nouvelle séance" buttons across the app open this dialog instead of navigating.

**Tech Stack:** NestJS (backend endpoint), Next.js + React Query + Zustand + shadcn/ui (frontend)

**Spec:** `docs/superpowers/specs/2026-05-13-smart-slot-picker-design.md`

---

## File Structure

### New files
| File | Responsibility |
|---|---|
| `apps/api/src/availability/dto/timeslots-query.dto.ts` | Validation DTO for timeslots query params |
| `apps/web/src/lib/api/availability.ts` | API client for `GET /availability/timeslots` |
| `apps/web/src/store/ui.store.ts` | Zustand store — dialog open state + defaultPatientId |
| `apps/web/src/components/sessions/mini-calendar.tsx` | Monthly calendar with green day indicators |
| `apps/web/src/components/sessions/time-slot-pills.tsx` | Clickable time slot pills for a selected day |
| `apps/web/src/components/sessions/smart-slot-picker-dialog.tsx` | Main 2-step dialog |

### Modified files
| File | Change |
|---|---|
| `apps/api/src/availability/availability.controller.ts` | Add `GET timeslots` endpoint |
| `apps/api/src/appointments/dto/appointment.dto.ts` | Add `reason?: string` to `CreateAppointmentDto` |
| `apps/web/src/lib/api/appointments.ts` | Add `reason` to `CreateAppointmentData` interface |
| `apps/web/src/app/(dashboard)/layout.tsx` | Mount `SmartSlotPickerDialog` |
| `apps/web/src/components/dashboard/dashboard-content.tsx` | Button opens dialog via Zustand |
| `apps/web/src/components/layouts/mobile-nav.tsx` | FAB opens dialog via Zustand |
| `apps/web/src/components/patients/patient-detail.tsx` | Button opens dialog with patientId |
| `apps/web/src/components/sessions/sessions-page.tsx` | Button opens dialog via Zustand |

---

## Task 1: Backend — Timeslots endpoint + reason DTO

**Files:**
- Create: `apps/api/src/availability/dto/timeslots-query.dto.ts`
- Modify: `apps/api/src/availability/availability.controller.ts`
- Modify: `apps/api/src/appointments/dto/appointment.dto.ts`

- [ ] **Step 1: Create the timeslots query DTO**

Create `apps/api/src/availability/dto/timeslots-query.dto.ts`:

```typescript
import { IsDateString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TimeslotsQueryDto {
  @ApiProperty({ description: 'Start date (ISO)', example: '2026-05-13' })
  @IsDateString()
  from!: string;

  @ApiProperty({ description: 'End date (ISO)', example: '2026-06-12' })
  @IsDateString()
  to!: string;

  @ApiPropertyOptional({ description: 'Session duration in minutes', default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(15)
  @Max(480)
  duration?: number;
}
```

- [ ] **Step 2: Add the timeslots endpoint to AvailabilityController**

In `apps/api/src/availability/availability.controller.ts`, add these imports at the top:

```typescript
import { Query } from '@nestjs/common';
import { TimeslotsQueryDto } from './dto/timeslots-query.dto';
```

Then add this method to the controller class, after the existing `getSlots()` method:

```typescript
@Get('timeslots')
@ApiOperation({ summary: 'Créneaux disponibles pour la psy connectée' })
async getTimeslots(
  @Query() query: TimeslotsQueryDto,
  @CurrentUser() user: KeycloakUser,
) {
  const psy = await this.availabilityService.getPsychologist(user.sub);
  const from = new Date(query.from);
  const to = new Date(query.to);

  // Max 30 days range
  const diffDays = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays > 30) {
    throw new BadRequestException('La plage ne peut pas dépasser 30 jours');
  }

  const slots = await this.availabilityService.getAvailableTimeslots(
    psy.id,
    from,
    to,
    query.duration ?? 50,
  );
  return slots.map((d) => d.toISOString());
}
```

Also add `BadRequestException` to the `@nestjs/common` imports.

**Important:** `getPsychologist` is a `private` method on `AvailabilityService`. You must change its visibility to `public` (or remove the `private` keyword) before calling it from the controller. It resolves a Keycloak userId (`user.sub`) to a Prisma psychologist record. The key point: `user.sub` is the Keycloak user ID, NOT the Prisma psychologist ID — this method does the lookup.

- [ ] **Step 3: Add `reason` to CreateAppointmentDto**

In `apps/api/src/appointments/dto/appointment.dto.ts`, add to `CreateAppointmentDto`:

```typescript
@ApiPropertyOptional({ description: 'Motif ou notes préliminaires' })
@IsString()
@IsOptional()
@MaxLength(2000)
reason?: string;
```

Verify `IsString` and `MaxLength` are already imported (they are in the current file).

- [ ] **Step 4: Add `reason` to the appointment service create method**

The `appointments.service.ts` `create()` method **cherry-picks fields explicitly** (does NOT spread `...dto`). You MUST add `reason: dto.reason` to the Prisma `create` data object. Find the `create()` method and add `reason: dto.reason,` alongside the other fields like `patientId`, `scheduledAt`, `duration`, etc. Without this, the `reason` field will be silently dropped and never saved.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/availability/dto/timeslots-query.dto.ts apps/api/src/availability/availability.controller.ts apps/api/src/appointments/dto/appointment.dto.ts
git commit -m "feat(api): add GET /availability/timeslots endpoint + reason field on appointments"
```

---

## Task 2: Frontend — API client + Zustand store

**Files:**
- Create: `apps/web/src/lib/api/availability.ts`
- Create: `apps/web/src/store/ui.store.ts`
- Modify: `apps/web/src/lib/api/appointments.ts`

- [ ] **Step 1: Create the availability API client**

Create `apps/web/src/lib/api/availability.ts`:

```typescript
import { apiClient } from './client';

export const availabilityApi = {
  getTimeslots: (from: string, to: string, duration: number, token: string): Promise<string[]> =>
    apiClient.get<string[]>(`/availability/timeslots?from=${from}&to=${to}&duration=${duration}`, token),
};
```

- [ ] **Step 2: Add `reason` to the appointments API client interface**

In `apps/web/src/lib/api/appointments.ts`, add `reason` to `CreateAppointmentData`:

```typescript
export interface CreateAppointmentData {
  patientId: string;
  scheduledAt: string;
  duration: number;
  isOnline?: boolean;
  paymentMode?: 'none' | 'prepayment' | 'post_session';
  paymentAmount?: number;
  reason?: string;  // ← add this line
}
```

- [ ] **Step 3: Create the Zustand UI store**

Create `apps/web/src/store/ui.store.ts`:

```typescript
import { create } from 'zustand';

interface UIState {
  smartSlotPickerOpen: boolean;
  smartSlotPickerDefaultPatientId: string | null;
  openSmartSlotPicker: (patientId?: string) => void;
  closeSmartSlotPicker: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  smartSlotPickerOpen: false,
  smartSlotPickerDefaultPatientId: null,
  openSmartSlotPicker: (patientId) =>
    set({ smartSlotPickerOpen: true, smartSlotPickerDefaultPatientId: patientId ?? null }),
  closeSmartSlotPicker: () =>
    set({ smartSlotPickerOpen: false, smartSlotPickerDefaultPatientId: null }),
}));
```

- [ ] **Step 4: Verify Zustand is installed**

Run: `cat apps/web/package.json | grep zustand`

If not present, run: `cd apps/web && pnpm add zustand`

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/api/availability.ts apps/web/src/store/ui.store.ts apps/web/src/lib/api/appointments.ts
git commit -m "feat(web): add availability API client + Zustand UI store for slot picker dialog"
```

---

## Task 3: Frontend — MiniCalendar component

**Files:**
- Create: `apps/web/src/components/sessions/mini-calendar.tsx`

- [ ] **Step 1: Create the MiniCalendar component**

Create `apps/web/src/components/sessions/mini-calendar.tsx`:

```tsx
'use client';

import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MiniCalendarProps {
  /** Currently viewed month (any date within that month) */
  currentMonth: Date;
  /** Set of date strings (YYYY-MM-DD) that have available slots */
  availableDays: Set<string>;
  /** Currently selected date string (YYYY-MM-DD) or null */
  selectedDay: string | null;
  /** Callback when a day is clicked */
  onSelectDay: (dateStr: string) => void;
  /** Navigate to previous/next month */
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function todayStr(): string {
  return toDateStr(new Date());
}

export function MiniCalendar({
  currentMonth,
  availableDays,
  selectedDay,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
}: MiniCalendarProps) {
  const weeks = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Monday = 0 in our grid. JS getDay: 0=Sun → we want Mon=0
    const startOffset = (firstDay.getDay() + 6) % 7;

    const days: Array<{ date: Date; dateStr: string; isCurrentMonth: boolean }> = [];

    // Fill preceding days from previous month
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, dateStr: toDateStr(d), isCurrentMonth: false });
    }

    // Fill current month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      days.push({ date, dateStr: toDateStr(date), isCurrentMonth: true });
    }

    // Fill remaining to complete last week
    while (days.length % 7 !== 0) {
      const d = new Date(year, month + 1, days.length - startOffset - lastDay.getDate() + 1);
      days.push({ date: d, dateStr: toDateStr(d), isCurrentMonth: false });
    }

    // Split into weeks
    const result: typeof days[] = [];
    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7));
    }
    return result;
  }, [currentMonth]);

  const today = todayStr();

  return (
    <div className="w-[210px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={onPrevMonth}
          className="p-1 rounded hover:bg-surface text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-sm font-semibold capitalize">{formatMonthYear(currentMonth)}</span>
        <button
          type="button"
          onClick={onNextMonth}
          className="p-1 rounded hover:bg-surface text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="text-[11px] font-semibold text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {weeks.flatMap((week) =>
          week.map((day) => {
            const isPast = day.dateStr < today;
            const isSelected = day.dateStr === selectedDay;
            const hasSlots = availableDays.has(day.dateStr);
            const isClickable = day.isCurrentMonth && !isPast && hasSlots;

            return (
              <button
                key={day.dateStr}
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onSelectDay(day.dateStr)}
                className={cn(
                  'text-[11px] py-1 rounded-full w-7 h-7 flex items-center justify-center mx-auto transition-colors',
                  !day.isCurrentMonth && 'text-muted-foreground/30',
                  day.isCurrentMonth && isPast && 'text-muted-foreground/40',
                  day.isCurrentMonth && !isPast && !hasSlots && 'text-muted-foreground',
                  isClickable && !isSelected && 'bg-green-50 text-foreground hover:bg-green-100 cursor-pointer',
                  isSelected && 'bg-primary text-white font-bold',
                  !isClickable && 'cursor-default',
                )}
              >
                {day.date.getDate()}
              </button>
            );
          }),
        )}
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <span className="w-2 h-2 rounded-full bg-green-100 inline-block" />
        Créneaux libres
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/sessions/mini-calendar.tsx
git commit -m "feat(web): add MiniCalendar component for slot picker"
```

---

## Task 4: Frontend — TimeSlotPills component

**Files:**
- Create: `apps/web/src/components/sessions/time-slot-pills.tsx`

- [ ] **Step 1: Create the TimeSlotPills component**

Create `apps/web/src/components/sessions/time-slot-pills.tsx`:

```tsx
'use client';

import { cn } from '@/lib/utils';

interface TimeSlotPillsProps {
  /** Date label, e.g. "Mardi 13 mai" */
  dayLabel: string;
  /** Array of time strings (HH:mm) for the selected day */
  slots: string[];
  /** Currently selected time (HH:mm) or null */
  selectedTime: string | null;
  /** Callback when a slot is clicked */
  onSelect: (time: string) => void;
  /** Whether slots are loading */
  isLoading?: boolean;
}

export function TimeSlotPills({
  dayLabel,
  slots,
  selectedTime,
  onSelect,
  isLoading,
}: TimeSlotPillsProps) {
  if (isLoading) {
    return (
      <div className="flex-1">
        <div className="h-5 w-32 bg-surface rounded animate-pulse mb-2" />
        <div className="h-4 w-24 bg-surface rounded animate-pulse mb-3" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-16 h-10 bg-surface rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <div className="font-semibold text-sm text-foreground capitalize">{dayLabel}</div>
      <div className="text-[11px] text-muted-foreground mb-3">
        {slots.length} créneau{slots.length !== 1 ? 'x' : ''} disponible{slots.length !== 1 ? 's' : ''}
      </div>

      {slots.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          Pas de créneaux disponibles ce jour
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {slots.map((time) => (
            <button
              key={time}
              type="button"
              onClick={() => onSelect(time)}
              className={cn(
                'px-5 py-2.5 rounded-lg text-sm font-medium transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                selectedTime === time
                  ? 'border-2 border-primary bg-primary/5 text-primary font-semibold'
                  : 'bg-surface border border-border text-muted-foreground hover:bg-primary/5 hover:border-primary/30',
              )}
            >
              {time}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/sessions/time-slot-pills.tsx
git commit -m "feat(web): add TimeSlotPills component for slot picker"
```

---

## Task 5: Frontend — SmartSlotPickerDialog (main component)

**Files:**
- Create: `apps/web/src/components/sessions/smart-slot-picker-dialog.tsx`

This is the main component. It's the largest file and handles:
- 2-step flow (step 1: patient + duration + calendar/slots, step 2: options)
- Fetching timeslots via React Query
- Grouping UTC timestamps into days (Europe/Paris timezone)
- Appointment creation via existing `appointmentsApi`

- [ ] **Step 1: Create the SmartSlotPickerDialog component**

Create `apps/web/src/components/sessions/smart-slot-picker-dialog.tsx`:

```tsx
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Video, CreditCard, Calendar, ArrowLeft } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { useUIStore } from '@/store/ui.store';
import { availabilityApi } from '@/lib/api/availability';
import { appointmentsApi } from '@/lib/api/appointments';
import { patientsApi } from '@/lib/api/patients';
import { psychologistApi } from '@/lib/api/psychologist';
import { cn } from '@/lib/utils';
import { MiniCalendar } from './mini-calendar';
import { TimeSlotPills } from './time-slot-pills';
import { ParticipantMultiSelect } from '../calendar/participant-multi-select';

const DURATION_OPTIONS = [30, 45, 50, 60, 90, 120];

/** Convert a UTC ISO string to Europe/Paris date string (YYYY-MM-DD) */
function toParisDateStr(isoStr: string): string {
  const d = new Date(isoStr);
  const parts = new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const y = parts.find((p) => p.type === 'year')!.value;
  const m = parts.find((p) => p.type === 'month')!.value;
  const dd = parts.find((p) => p.type === 'day')!.value;
  return `${y}-${m}-${dd}`;
}

/** Convert a UTC ISO string to Europe/Paris time string (HH:mm) */
function toParisTime(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleTimeString('fr-FR', {
    timeZone: 'Europe/Paris',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/** Format a date string to French label */
function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/** Get ISO date strings for a range */
function getDateRange(monthDate: Date, rangeMonths: number = 1): { from: string; to: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const from = new Date(Math.max(monthDate.getTime(), today.getTime()));
  const to = new Date(from);
  to.setDate(to.getDate() + 30);

  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
}

export function SmartSlotPickerDialog() {
  const { smartSlotPickerOpen: open, smartSlotPickerDefaultPatientId, closeSmartSlotPicker } = useUIStore();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const token = session?.accessToken ?? '';

  // Step state
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 state
  const [patientId, setPatientId] = useState('');
  const [search, setSearch] = useState('');
  const [duration, setDuration] = useState(50);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Step 2 state
  const [isOnline, setIsOnline] = useState(false);
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [rate, setRate] = useState('');
  const [paymentMode, setPaymentMode] = useState<'none' | 'prepayment' | 'post_session'>('none');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [reason, setReason] = useState('');

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setStep(1);
      setPatientId(smartSlotPickerDefaultPatientId ?? '');
      setSearch('');
      setDuration(50);
      setCurrentMonth(new Date());
      setSelectedDay(null);
      setSelectedTime(null);
      setIsOnline(false);
      setParticipantIds([]);
      setRate('');
      setPaymentMode('none');
      setPaymentAmount('');
      setReason('');
    }
  }, [open, smartSlotPickerDefaultPatientId]);

  // Fetch patients
  const { data: patientsData } = useQuery({
    queryKey: ['patients', 'all-for-slot-picker'],
    queryFn: () => patientsApi.list({ limit: 200, status: 'active' }, token),
    enabled: open && !!token,
  });
  const patients = useMemo(() => patientsData?.data ?? [], [patientsData?.data]);

  const filteredPatients = useMemo(() => {
    if (!search.trim()) return patients;
    const q = search.toLowerCase();
    return patients.filter((p) => p.name.toLowerCase().includes(q));
  }, [patients, search]);

  // Fetch psy profile
  const { data: psyProfile } = useQuery({
    queryKey: ['psychologist', 'profile'],
    queryFn: () => psychologistApi.getProfile(token),
    enabled: open && !!token,
  });

  // Set default rate when profile loads
  useEffect(() => {
    if (psyProfile?.defaultSessionRate && !rate) {
      setRate(String(psyProfile.defaultSessionRate));
    }
  }, [psyProfile?.defaultSessionRate, rate]);

  const canRequestPayment = psyProfile?.stripeOnboardingComplete === true;

  // Fetch timeslots
  const { from, to } = useMemo(() => getDateRange(currentMonth), [currentMonth]);

  const { data: timeslots, isLoading: slotsLoading, isError: slotsError, refetch: refetchSlots } = useQuery({
    queryKey: ['available-timeslots', from, to, duration],
    queryFn: () => availabilityApi.getTimeslots(from, to, duration, token),
    enabled: open && !!token,
    staleTime: 30_000,
  });

  // Group timeslots by day (Europe/Paris)
  const slotsByDay = useMemo(() => {
    if (!timeslots) return new Map<string, string[]>();
    const map = new Map<string, string[]>();
    for (const iso of timeslots) {
      const dayStr = toParisDateStr(iso);
      const timeStr = toParisTime(iso);
      if (!map.has(dayStr)) map.set(dayStr, []);
      map.get(dayStr)!.push(timeStr);
    }
    return map;
  }, [timeslots]);

  const availableDays = useMemo(() => new Set(slotsByDay.keys()), [slotsByDay]);

  // Auto-select first available day when slots load
  useEffect(() => {
    if (slotsByDay.size > 0 && !selectedDay) {
      const sortedDays = [...slotsByDay.keys()].sort();
      if (sortedDays[0]) setSelectedDay(sortedDays[0]);
    }
  }, [slotsByDay, selectedDay]);

  // Reset selection when duration changes
  const handleDurationChange = useCallback((d: number) => {
    setDuration(d);
    setSelectedDay(null);
    setSelectedTime(null);
  }, []);

  const selectedDaySlots = selectedDay ? slotsByDay.get(selectedDay) ?? [] : [];

  // Find the ISO timestamp for the selected day+time
  const selectedIso = useMemo(() => {
    if (!selectedDay || !selectedTime || !timeslots) return null;
    return timeslots.find((iso) => {
      return toParisDateStr(iso) === selectedDay && toParisTime(iso) === selectedTime;
    }) ?? null;
  }, [selectedDay, selectedTime, timeslots]);

  const selectedPatient = patients.find((p) => p.id === patientId);

  // Create appointment mutation
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
          token,
        );
      }
      return appointmentsApi.create(data, token);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['appointments'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      const label = selectedDay ? formatDayLabel(selectedDay) : '';
      success(`Séance planifiée le ${label} à ${selectedTime}`);
      closeSmartSlotPicker();
    },
    onError: (e: Error) => {
      showError(e.message || 'Erreur lors de la planification');
    },
  });

  const handleSubmit = () => {
    if (!selectedIso || !patientId) return;

    const amount =
      paymentMode !== 'none' && paymentAmount ? Number(paymentAmount) : undefined;

    createMutation.mutate({
      patientId,
      scheduledAt: selectedIso,
      duration,
      isOnline: isOnline || undefined,
      paymentMode: paymentMode !== 'none' ? paymentMode : undefined,
      paymentAmount: amount,
      reason: reason.trim() || undefined,
      participantIds: isOnline && participantIds.length > 0 ? participantIds : undefined,
    });
  };

  const canGoNext = !!patientId && !!selectedIso;

  return (
    <Dialog open={open} onClose={closeSmartSlotPicker} title="Nouvelle séance" className="max-w-[660px]">
      {/* Progress bar */}
      <div className="h-[3px] bg-surface rounded-full mb-5">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: step === 1 ? '50%' : '100%' }}
        />
      </div>

      {step === 1 ? (
        <div className="space-y-5">
          <p className="text-xs text-muted-foreground">Étape 1/2 — Patient et créneau</p>

          {/* Patient selector */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Patient</label>
            {selectedPatient ? (
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-primary/30 bg-primary/5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-[11px] font-semibold">
                    {selectedPatient.name
                      .split(' ')
                      .map((w) => w[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <span className="text-sm font-medium">{selectedPatient.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setPatientId(''); setParticipantIds([]); }}
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
                        onClick={() => { setPatientId(p.id); setSearch(''); }}
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

          {/* Duration */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Durée</label>
            <div className="flex flex-wrap gap-1.5">
              {DURATION_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleDurationChange(d)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
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

          {/* Calendar + Slots */}
          {slotsError ? (
            <div className="text-center py-6">
              <p className="text-sm text-destructive mb-2">Impossible de charger les créneaux</p>
              <Button type="button" variant="outline" size="sm" onClick={() => void refetchSlots()}>
                Réessayer
              </Button>
            </div>
          ) : timeslots && timeslots.length === 0 ? (
            <div className="text-center py-6">
              <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-1">Aucun créneau disponible</p>
              <p className="text-xs text-muted-foreground/60">
                Configurez vos disponibilités dans le{' '}
                <a href="/dashboard/calendar" className="text-primary underline">calendrier</a>
              </p>
            </div>
          ) : (
            <div className="flex gap-5 flex-col sm:flex-row">
              <MiniCalendar
                currentMonth={currentMonth}
                availableDays={availableDays}
                selectedDay={selectedDay}
                onSelectDay={(d) => { setSelectedDay(d); setSelectedTime(null); }}
                onPrevMonth={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                onNextMonth={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
              />
              <TimeSlotPills
                dayLabel={selectedDay ? formatDayLabel(selectedDay) : ''}
                slots={selectedDaySlots}
                selectedTime={selectedTime}
                onSelect={setSelectedTime}
                isLoading={slotsLoading}
              />
            </div>
          )}

          {/* Selection summary */}
          {selectedIso && (
            <div className="flex items-center gap-2.5 p-3 bg-[#F8F7FF] rounded-lg border border-[#E8E6F0]">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <div>
                <div className="text-[11px] text-muted-foreground">Créneau sélectionné</div>
                <div className="text-sm font-semibold text-foreground">
                  {formatDayLabel(selectedDay!)} à {selectedTime} — {duration} min
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-surface">
            <Button type="button" variant="outline" onClick={closeSmartSlotPicker}>
              Annuler
            </Button>
            <Button type="button" disabled={!canGoNext} onClick={() => setStep(2)}>
              Suivant →
            </Button>
          </div>
        </div>
      ) : (
        /* Step 2 — Options */
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">Étape 2/2 — Options</p>

          {/* Recap */}
          <div className="flex items-center gap-3 p-3 bg-[#F8F7FF] rounded-lg border border-[#E8E6F0]">
            {selectedPatient && (
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-semibold">
                {selectedPatient.name
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <div className="text-sm font-semibold text-foreground">{selectedPatient?.name}</div>
              <div className="text-xs text-muted-foreground">
                {selectedDay && formatDayLabel(selectedDay)} à {selectedTime} — {duration} min
              </div>
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs text-primary underline hover:no-underline"
            >
              Modifier
            </button>
          </div>

          {/* Visio toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="slot-isOnline"
              checked={isOnline}
              onChange={(e) => {
                setIsOnline(e.target.checked);
                if (!e.target.checked) setParticipantIds([]);
              }}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="slot-isOnline" className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Video className="h-4 w-4" />
              Consultation en visio
            </label>
          </div>

          {/* Group participants (visio only) */}
          {isOnline && patientId && (
            <div className="space-y-2">
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

          {/* Rate */}
          <Input
            label="Tarif (€)"
            type="number"
            min={0}
            max={1000}
            step="any"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="ex: 70"
          />

          {/* Payment mode */}
          <div className="space-y-2">
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
                {(['none', 'prepayment', 'post_session'] as const).map((mode) => (
                  <label key={mode} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="slotPaymentMode"
                      value={mode}
                      checked={paymentMode === mode}
                      onChange={() => {
                        setPaymentMode(mode);
                        if (mode !== 'none' && !paymentAmount && rate) {
                          setPaymentAmount(rate);
                        }
                      }}
                      className="h-4 w-4 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-muted-foreground">
                      {mode === 'none' && 'Pas de paiement en ligne'}
                      {mode === 'prepayment' && 'Prépaiement (lien envoyé au patient)'}
                      {mode === 'post_session' && 'Après la séance'}
                    </span>
                  </label>
                ))}
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
              </div>
            )}
          </div>

          {/* Reason / notes */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Notes préliminaires{' '}
              <span className="font-normal text-muted-foreground">(optionnel)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={2000}
              placeholder="Objectifs de la séance, points à aborder..."
              className="w-full px-3 py-2.5 text-sm border border-input rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 resize-y min-h-[60px]"
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-surface">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft size={14} className="mr-1" />
              Retour
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              loading={createMutation.isPending}
              className="bg-accent hover:bg-accent/90 text-white"
            >
              Planifier la séance
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/sessions/smart-slot-picker-dialog.tsx
git commit -m "feat(web): add SmartSlotPickerDialog — 2-step appointment creation with slot picker"
```

---

## Task 6: Wire up all entry points

**Files:**
- Modify: `apps/web/src/app/(dashboard)/layout.tsx`
- Modify: `apps/web/src/components/dashboard/dashboard-content.tsx`
- Modify: `apps/web/src/components/layouts/mobile-nav.tsx`
- Modify: `apps/web/src/components/patients/patient-detail.tsx`
- Modify: `apps/web/src/components/sessions/sessions-page.tsx`

- [ ] **Step 1: Mount the dialog in the dashboard layout**

In `apps/web/src/app/(dashboard)/layout.tsx`, add the dialog component. It must be rendered once, outside of page-level components, so it's accessible from anywhere.

Add the import:
```tsx
import { SmartSlotPickerDialog } from '@/components/sessions/smart-slot-picker-dialog';
```

Add `<SmartSlotPickerDialog />` inside the layout's JSX, right before or after the main content area (at the same level as `Sidebar`, `Topbar`, etc.). Since the dialog manages its own open state via Zustand, it doesn't need any props.

- [ ] **Step 2: Dashboard — change "Nouvelle séance" to open dialog**

In `apps/web/src/components/dashboard/dashboard-content.tsx`, find the "Nouvelle séance" button/link. It currently uses `<Link href="/dashboard/sessions/new">` or similar.

Change it to a button that calls `useUIStore().openSmartSlotPicker()`:

```tsx
import { useUIStore } from '@/store/ui.store';

// Inside the component:
const openSlotPicker = useUIStore((s) => s.openSmartSlotPicker);

// Replace the Link with:
<button onClick={() => openSlotPicker()}>
  {/* keep existing content/styling */}
  Nouvelle séance
</button>
```

Keep the existing classes/icons — only change the element from `<Link>` to `<button>` and the handler.

- [ ] **Step 3: Mobile nav — change FAB to open dialog**

In `apps/web/src/components/layouts/mobile-nav.tsx`, find the FAB button that links to `/dashboard/sessions/new`.

Same pattern — replace the `<Link>` with a button calling `openSmartSlotPicker()`:

```tsx
import { useUIStore } from '@/store/ui.store';

// Inside the component:
const openSlotPicker = useUIStore((s) => s.openSmartSlotPicker);
```

Replace the Link element with a button using the same classes. Since this component might be a server component, ensure it has `'use client'` at the top.

- [ ] **Step 4: Patient detail — open dialog with pre-selected patient**

In `apps/web/src/components/patients/patient-detail.tsx`, find the "Nouvelle séance" button (around line 153-159).

Replace it to open the dialog with the patient pre-selected:

```tsx
import { useUIStore } from '@/store/ui.store';

const openSlotPicker = useUIStore((s) => s.openSmartSlotPicker);

// Replace:
<button onClick={() => openSlotPicker(patient.id)}>
  Nouvelle séance
</button>
```

- [ ] **Step 5: Sessions page — open dialog**

In `apps/web/src/components/sessions/sessions-page.tsx`, find the "Nouvelle séance" button (around line 33-36).

Same pattern:

```tsx
import { useUIStore } from '@/store/ui.store';

const openSlotPicker = useUIStore((s) => s.openSmartSlotPicker);

// Replace Link/button with:
<Button onClick={() => openSlotPicker()}>
  <Plus size={16} className="mr-1" />
  Nouvelle séance
</Button>
```

- [ ] **Step 6: Test all entry points manually**

Verify each entry point opens the dialog:
1. Dashboard "Nouvelle séance" quick action → dialog opens
2. Mobile bottom nav FAB → dialog opens
3. Patient detail page button → dialog opens with patient pre-selected
4. Sessions list page button → dialog opens

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/app/(dashboard)/layout.tsx apps/web/src/components/dashboard/dashboard-content.tsx apps/web/src/components/layouts/mobile-nav.tsx apps/web/src/components/patients/patient-detail.tsx apps/web/src/components/sessions/sessions-page.tsx
git commit -m "feat(web): wire all 'Nouvelle séance' buttons to SmartSlotPickerDialog"
```

---

## Task 7: Integration verification

- [ ] **Step 1: Start dev servers and test end-to-end**

Run both the API and web dev servers. Test the full flow:

1. Click "Nouvelle séance" on the dashboard
2. Select a patient from the search
3. Change duration → verify slots reload
4. Click a green day in the mini-calendar → verify pills appear
5. Click a time pill → verify summary appears
6. Click "Suivant →"
7. Toggle visio, set rate, select payment mode
8. Add notes préliminaires
9. Click "Planifier la séance"
10. Verify the appointment appears in the calendar
11. Verify toast success message

- [ ] **Step 2: Test from patient detail with pre-selected patient**

Open a patient's detail page → click "Nouvelle séance" → verify the patient is pre-selected in the dialog and cannot be changed (or shows "Changer" button).

- [ ] **Step 3: Test edge cases**

- No availability configured → should show "Configurez vos disponibilités" message
- All slots taken → should show "Aucun créneau disponible"
- API error → should show "Impossible de charger" + retry button
- Mobile viewport → calendar and pills should stack vertically

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix(web): smart slot picker polish and edge case fixes"
```
