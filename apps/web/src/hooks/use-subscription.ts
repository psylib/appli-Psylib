'use client';

import { useDashboardKpis } from './use-dashboard';

const PLAN_RANK: Record<string, number> = { free: 0, solo: 1, pro: 2, clinic: 3 };

export function useSubscription() {
  const { data: kpis, isLoading } = useDashboardKpis();
  const plan = kpis?.subscription?.plan ?? 'free';
  const rank = PLAN_RANK[plan] ?? 0;

  return {
    plan,
    isLoading,
    isFree: rank === 0,
    isSolo: rank >= 1,
    isPro: rank >= 2,
    isClinic: rank >= 3,
    canAccess: (required: 'solo' | 'pro' | 'clinic') =>
      rank >= (PLAN_RANK[required] ?? 99),
  };
}
