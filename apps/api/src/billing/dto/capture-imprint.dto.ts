import { z } from 'zod';

export const CaptureImprintSchema = z.object({
  amount: z.number().positive().max(10000),
});

export type CaptureImprintDto = z.infer<typeof CaptureImprintSchema>;
