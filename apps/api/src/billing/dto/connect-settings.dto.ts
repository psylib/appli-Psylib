import { z } from 'zod';

export const ConnectSettingsSchema = z.object({
  paymentMode: z.enum(['prepaid', 'postpaid', 'both']),
  cancellationDelay: z.number().int().min(0).max(168),
  autoRefund: z.boolean(),
  defaultSessionRate: z.number().min(0).max(10000),
});

export type ConnectSettingsDto = z.infer<typeof ConnectSettingsSchema>;
