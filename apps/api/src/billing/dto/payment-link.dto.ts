import { z } from 'zod';

export const PaymentLinkSchema = z.object({
  appointmentId: z.string().uuid().optional(),
  sessionId: z.string().uuid().optional(),
  amount: z.number().min(0.5).max(10000).optional(),
}).refine((data) => data.appointmentId || data.sessionId, {
  message: 'appointmentId or sessionId is required',
});

export type PaymentLinkDto = z.infer<typeof PaymentLinkSchema>;
