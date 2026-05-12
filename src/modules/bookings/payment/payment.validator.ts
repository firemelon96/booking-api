import z from 'zod';

export const createPaymentSchema = z.object({
  bookingId: z.string(),
  userId: z.string(),
});

export const createAccommodationSchema = z.object({
  accommodationId: z.string(),
  userId: z.string(),
  unitId: z.string().optional(),
});
