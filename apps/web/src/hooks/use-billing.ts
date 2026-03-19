'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { billingApi } from '@/lib/api/billing';
import { SubscriptionPlan } from '@psyscale/shared-types';

export function useSubscription() {
  const { data: session } = useSession();
  return useQuery({
    queryKey: ['billing', 'subscription'],
    queryFn: () => billingApi.getSubscription(session!.accessToken),
    enabled: !!session?.accessToken,
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

export function useInvoices() {
  const { data: session } = useSession();
  return useQuery({
    queryKey: ['billing', 'invoices'],
    queryFn: () => billingApi.getInvoices(session!.accessToken),
    enabled: !!session?.accessToken,
    staleTime: 10 * 60 * 1000, // 10 min
  });
}

export function useCreateCheckout() {
  const { data: session } = useSession();
  return useMutation({
    mutationFn: (plan: SubscriptionPlan) =>
      billingApi.createCheckout(plan, session!.accessToken),
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
  });
}

export function useCreatePortal() {
  const { data: session } = useSession();
  return useMutation({
    mutationFn: () => billingApi.createPortal(session!.accessToken),
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
  });
}
