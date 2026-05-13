'use client';

import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MiniCalendarProps {
  currentMonth: Date;
  availableDays: Set<string>;
  selectedDay: string | null;
  onSelectDay: (dateStr: string) => void;
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

    const startOffset = (firstDay.getDay() + 6) % 7;

    const days: Array<{ date: Date; dateStr: string; isCurrentMonth: boolean }> = [];

    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, dateStr: toDateStr(d), isCurrentMonth: false });
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      days.push({ date, dateStr: toDateStr(date), isCurrentMonth: true });
    }

    while (days.length % 7 !== 0) {
      const d = new Date(year, month + 1, days.length - startOffset - lastDay.getDate() + 1);
      days.push({ date: d, dateStr: toDateStr(d), isCurrentMonth: false });
    }

    const result: typeof days[] = [];
    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7));
    }
    return result;
  }, [currentMonth]);

  const today = todayStr();

  return (
    <div className="w-[210px]">
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

      <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="text-[11px] font-semibold text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

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

      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <span className="w-2 h-2 rounded-full bg-green-100 inline-block" />
        Créneaux libres
      </div>
    </div>
  );
}
