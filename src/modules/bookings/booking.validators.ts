import z from 'zod';
import { BookingStatus, PricingType, Role } from '../../generated/prisma/enums';

export const bookingIdParams = z.object({
  bookingId: z.string(),
});

export const bookingQuerySchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  sort: z.string().optional(),
  search: z.string().optional(),
  tourId: z.string().optional(),
  status: z.enum(BookingStatus).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  userId: z.string(),
  role: z.enum(Role),
});

export const reschedulBookingSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  scheduleId: z.string().optional(),

  checkIn: z.coerce.date().optional(),
  checkOut: z.coerce.date().optional(),
  reason: z.string().optional(),
});

export const createBookingSchema = z
  .object({
    tourId: z.uuid(),
    userId: z.uuid(),
    role: z.enum(Role),
    pricingType: z.enum(PricingType),
    participants: z.number().int().min(1).max(100),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    scheduleId: z.string().optional(),
    notes: z.string().optional(),
  })
  .transform((data) => ({
    ...data,
    endDate: data.endDate ?? data.startDate,
  }))
  .refine(
    (d) => {
      if (!d.endDate) return true;
      return new Date(d.endDate).getTime() >= new Date(d.startDate).getTime();
    },
    {
      message: 'End date must be Greater than the start date',
      path: ['endDate'],
    },
  );

export const bookingSchema = z.object({
  bookingId: z.string(),
  userId: z.string(),
  role: z.enum(Role),
});
