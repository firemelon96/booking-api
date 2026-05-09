import z from 'zod';

export const cancellationPolicySchema = z.object({
  description: z.string().optional(),
  fullRefundHours: z.number().min(1),
  partialRefundHours: z.number().min(1),
  partialRefundPercentage: z.number().min(1),
  tourId: z.uuid(),
});
