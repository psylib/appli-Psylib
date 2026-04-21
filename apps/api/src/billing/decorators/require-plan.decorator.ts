import { SetMetadata } from '@nestjs/common';
import { SubscriptionPlan } from '@psyscale/shared-types';

export const PLAN_KEY = 'required_plan';
export const FEATURE_KEY = 'required_feature';

export type BillingFeature = 'patients' | 'sessions' | 'ai_summary' | 'ai_exercise' | 'video' | 'courses' | 'expenses';

/** Exige un plan minimum pour accéder à la route */
export const RequirePlan = (...plans: SubscriptionPlan[]) => SetMetadata(PLAN_KEY, plans);

/** Vérifie les limites du plan (patients/sessions/ai) avant d'autoriser */
export const RequireFeature = (feature: BillingFeature) => SetMetadata(FEATURE_KEY, feature);
