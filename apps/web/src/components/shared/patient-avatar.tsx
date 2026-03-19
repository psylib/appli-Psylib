import { getInitials, cn } from '@/lib/utils';

interface PatientAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const AVATAR_COLORS = [
  'bg-primary/20 text-primary',
  'bg-accent/20 text-accent',
  'bg-warm/20 text-warm',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
];

function getAvatarColor(name: string): string {
  const index = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index] ?? AVATAR_COLORS[0] ?? 'bg-primary/20 text-primary';
}

export function PatientAvatar({ name, size = 'md', className }: PatientAvatarProps) {
  const sizeMap = { sm: 'h-8 w-8 text-xs', md: 'h-9 w-9 text-sm', lg: 'h-12 w-12 text-base' };

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold flex-shrink-0',
        sizeMap[size],
        getAvatarColor(name),
        className,
      )}
      aria-hidden="true"
    >
      {getInitials(name)}
    </div>
  );
}
