import { useAuthStore } from '@/store/auth.store';

const PRO_PLANS = ['pro', 'clinic'];
const PAID_PLANS = ['solo', 'pro', 'clinic'];

export function usePlanFeatures() {
  const plan = (useAuthStore((s) => s.plan) ?? 'free').toLowerCase();

  return {
    plan,
    canAccessAccounting: PRO_PLANS.includes(plan),
    canAccessAI: PAID_PLANS.includes(plan),
    canAccessInstantVideo: PRO_PLANS.includes(plan),
    isPro: PRO_PLANS.includes(plan),
    isPaid: PAID_PLANS.includes(plan),
  };
}
