import { cn, formatTrend } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  icon?: LucideIcon;
  color?: 'primary' | 'accent' | 'warm' | 'default';
  className?: string;
}

export function KpiCard({
  label,
  value,
  trend,
  trendLabel,
  icon: Icon,
  color = 'default',
  className,
}: KpiCardProps) {
  const colorMap = {
    primary: 'bg-primary/10 text-primary',
    accent: 'bg-accent/10 text-accent',
    warm: 'bg-warm/10 text-warm',
    default: 'bg-surface text-muted-foreground',
  };

  const TrendIcon = trend === undefined || trend === 0 ? Minus : trend > 0 ? TrendingUp : TrendingDown;
  const trendColor =
    trend === undefined || trend === 0
      ? 'text-muted-foreground'
      : trend > 0
        ? 'text-accent'
        : 'text-destructive';

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-white p-6 space-y-3 shadow-sm hover:shadow-md transition-shadow',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon && (
          <div className={cn('rounded-lg p-2 flex items-center justify-center', colorMap[color])}>
            <Icon size={18} aria-hidden="true" />
          </div>
        )}
      </div>

      <p className="text-2xl font-bold text-foreground">{value}</p>

      {trend !== undefined && (
        <div className={cn('flex items-center gap-1.5 text-xs', trendColor)}>
          <TrendIcon size={14} aria-hidden="true" />
          <span>
            {formatTrend(trend)} {trendLabel ?? 'vs mois dernier'}
          </span>
        </div>
      )}
    </div>
  );
}
