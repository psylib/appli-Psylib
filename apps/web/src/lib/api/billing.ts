import { apiClient } from './client';
import { SubscriptionPlan, SubscriptionStatus } from '@psyscale/shared-types';
import type { ConnectSettings } from '@psyscale/shared-types';

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

export interface PaymentItem {
  id: string;
  amount: number;
  status: string;
  type: string;
  stripePaymentIntentId: string | null;
  createdAt: string;
  patient: { id: string; name: string; email: string } | null;
  appointment: { id: string; scheduledAt: string } | null;
}

export interface PaymentsResponse {
  payments: PaymentItem[];
  total: number;
  page: number;
  limit: number;
  kpis: {
    totalReceived: number;
    totalPending: number;
    transactionCount: number;
    onlineRate: number;
  };
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

  // --- Stripe Connect (patient payments) ---

  startConnectOnboarding: (token: string) =>
    apiClient.post<{ url: string }>('/billing/connect/onboard', {}, token),

  getConnectStatus: (token: string) =>
    apiClient.get<{
      chargesEnabled: boolean;
      payoutsEnabled: boolean;
      detailsSubmitted: boolean;
    }>('/billing/connect/status', token),

  updateConnectSettings: (settings: ConnectSettings, token: string) =>
    apiClient.put<void>('/billing/connect/settings', settings, token),

  createPaymentLink: (data: { appointmentId?: string; sessionId?: string; amount?: number }, token: string) =>
    apiClient.post<{ checkoutUrl: string; paymentId: string }>('/billing/payment-link', data, token),

  refund: (appointmentId: string, token: string) =>
    apiClient.post<{ success: boolean }>('/billing/refund', { appointmentId }, token),

  markPaidOnSite: (appointmentId: string, token: string) =>
    apiClient.post<{ success: boolean }>(`/billing/mark-paid/${appointmentId}`, {}, token),

  getPayments: (query: { from?: string; to?: string; status?: string; mode?: string; page?: number }, token: string) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v != null && v !== '') params.set(k, String(v));
    });
    const qs = params.toString();
    return apiClient.get<PaymentsResponse>(`/billing/payments${qs ? `?${qs}` : ''}`, token);
  },
};
