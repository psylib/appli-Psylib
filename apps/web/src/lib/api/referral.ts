import { apiClient } from './client';

export interface ReferralCode {
  code: string;
}

export interface ReferralStats {
  sent: number;
  converted: number;
  rewardsPending: number;
}

export const referralApi = {
  getMyCode: (token: string) =>
    apiClient.get<ReferralCode>('/referral/my-code', token),

  getStats: (token: string) =>
    apiClient.get<ReferralStats>('/referral/stats', token),

  validateCode: (code: string, token: string) =>
    apiClient.post<{ success: boolean }>('/referral/validate', { code }, token),
};
