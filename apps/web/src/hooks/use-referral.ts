'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { referralApi } from '@/lib/api/referral';

export function useReferralCode() {
  const { data: session } = useSession();
  return useQuery({
    queryKey: ['referral', 'code'],
    queryFn: () => referralApi.getMyCode(session!.accessToken),
    enabled: !!session?.accessToken,
    staleTime: 60 * 60 * 1000, // 1h — le code ne change pas
  });
}

export function useReferralStats() {
  const { data: session } = useSession();
  return useQuery({
    queryKey: ['referral', 'stats'],
    queryFn: () => referralApi.getStats(session!.accessToken),
    enabled: !!session?.accessToken,
    staleTime: 2 * 60 * 1000, // 2 min
  });
}

export function useValidateReferralCode() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => referralApi.validateCode(code, session!.accessToken),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['referral'] });
    },
  });
}
