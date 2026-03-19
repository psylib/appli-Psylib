import { apiClient } from './client';
import { SubscriptionPlan, SubscriptionStatus } from '@psyscale/shared-types';

export interface SubscriptionDetails {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: string | null;
  stripeCustomerId: string | null;
}

export interface InvoiceItem {
  id: string;
  number: string | null;
  amountPaid: number; // centimes
  status: string | null;
  date: number; // unix timestamp
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
}

export const billingApi = {
  createCheckout: (plan: SubscriptionPlan, token: string) =>
    apiClient.post<{ url: string }>('/billing/checkout', { plan }, token),

  createPortal: (token: string) =>
    apiClient.post<{ url: string }>('/billing/portal', {}, token),

  getSubscription: (token: string) =>
    apiClient.get<SubscriptionDetails>('/billing/subscription', token),

  getInvoices: (token: string) =>
    apiClient.get<InvoiceItem[]>('/billing/invoices', token),
};
