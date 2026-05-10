'use client';

import { useDashboardKpis } from './use-dashboard';

const PLAN_RANK: Record<string, number> = { free: 0, solo: 1, pro: 2, clinic: 3 };

/** @deprecated Use useSubscriptionPlan() instead — avoids naming conflict with use-billing.ts */
export function useSubscription() {
  return useSubscriptionPlan();
}

export function useSubscriptionPlan() {
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
