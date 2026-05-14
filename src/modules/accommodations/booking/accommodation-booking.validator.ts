import z from 'zod';
import { Role } from '../../../generated/prisma/enums';

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

export const rescheduleAccommodationBookingSchema = z
  .object({
    bookingId: z.uuid(),
    checkIn: z.coerce.date(),
    checkOut: z.coerce.date(),
    role: z.enum(Role),
    userId: z.uuid(),
  })
  .refine((a) => a.checkOut > a.checkIn, {
    message: 'Check out must be after check in',
    path: ['checkOut'],
  });
