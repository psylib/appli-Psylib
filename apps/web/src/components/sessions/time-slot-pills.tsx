'use client';

import { cn } from '@/lib/utils';

interface TimeSlotPillsProps {
  dayLabel: string;
  slots: string[];
  selectedTime: string | null;
  onSelect: (time: string) => void;
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
