export interface SmsProvider {
  sendSms(to: string, message: string): Promise<{ success: boolean; messageId?: string }>;
}

export const SMS_PROVIDER = 'SMS_PROVIDER';
