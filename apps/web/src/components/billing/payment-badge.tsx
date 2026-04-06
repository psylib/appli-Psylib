'use client';

import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  paid: { label: 'Payé', className: 'bg-green-100 text-green-800 border-green-200' },
  failed: { label: 'Échoué', className: 'bg-red-100 text-red-800 border-red-200' },
  refunded: { label: 'Remboursé', className: 'bg-gray-100 text-gray-800 border-gray-200' },
};

interface PaymentBadgeProps {
  status: string;
  className?: string;
}

export function PaymentBadge({ status, className }: PaymentBadgeProps) {
  const config = statusConfig[status] ?? { label: status, className: 'bg-gray-100 text-gray-800 border-gray-200' };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
