import z from 'zod';

export const createPaymentSchema = z.object({
  bookingId: z.string(),
  userId: z.string(),
});
