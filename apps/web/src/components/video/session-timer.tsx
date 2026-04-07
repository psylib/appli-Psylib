'use client';

import { formatElapsedTime } from '@/hooks/use-video-call';
import { Clock } from 'lucide-react';

interface SessionTimerProps {
  elapsedSeconds: number;
  plannedDurationMin: number;
}

export function SessionTimer({ elapsedSeconds, plannedDurationMin }: SessionTimerProps) {
  const isOvertime = elapsedSeconds > plannedDurationMin * 60;

  return (
    <div className={`flex items-center gap-1.5 text-sm font-mono ${isOvertime ? 'text-red-500' : 'text-foreground'}`}>
      <Clock className="h-4 w-4" />
      {formatElapsedTime(elapsedSeconds)}
      {isOvertime && <span className="text-xs font-sans">(depassé)</span>}
    </div>
  );
}
