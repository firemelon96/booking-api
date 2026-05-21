import z from 'zod';

export const createAccommodationBookingSchema = z
  .object({
    unitId: z.uuid().optional(),
    checkIn: z.coerce.date(),
    checkOut: z.coerce.date(),
    adults: z.number(),
    units: z.number().int().min(1).default(1),
    children: z.number().optional(),
    specialRequests: z.string().optional(),
  })
  .refine((b) => b.checkOut > b.checkIn, {
    message: 'Check out must be after check in',
    path: ['checkOut'],
  });

export const rescheduleAccommodationBookingSchema = z.object({
  checkIn: z.coerce.date(),
  checkOut: z.coerce.date(),
});

export const accommodationIdParams = z.object({
  accommodationId: z.uuid(),
});
