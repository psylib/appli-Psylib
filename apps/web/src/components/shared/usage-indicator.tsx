'use client';

import { cn } from '@/lib/utils';

interface UsageIndicatorProps {
  label: string;
  used: number;
  limit: number | null; // null or -1 = unlimited
}

export function UsageIndicator({ label, used, limit }: UsageIndicatorProps) {
  const isUnlimited = limit === null || limit === -1;
  const percentage = isUnlimited ? 0 : limit > 0 ? Math.round((used / limit) * 100) : 0;
  const isWarning = !isUnlimited && percentage >= 80;
  const isDanger = !isUnlimited && percentage >= 100;

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn(
        'font-medium',
        isDanger ? 'text-destructive' : isWarning ? 'text-amber-600' : 'text-foreground',
      )}>
        {used}{isUnlimited ? '' : `/${limit}`}
      </span>
      {!isUnlimited && limit !== null && limit > 0 && (
        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              isDanger ? 'bg-destructive' : isWarning ? 'bg-amber-500' : 'bg-primary',
            )}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
