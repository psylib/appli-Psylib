import { z } from 'zod';

export const RefundSchema = z.object({
  appointmentId: z.string().uuid(),
});

export type RefundDto = z.infer<typeof RefundSchema>;
