import z from 'zod';

export const createAccommodationBookingSchema = z
  .object({
    accommodationId: z.uuid(),
    unitId: z.uuid().optional(),
    userId: z.uuid(),
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
