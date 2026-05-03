import z from 'zod';
import { BookingStatus, PricingType, Role } from '../../generated/prisma/enums';
import path from 'node:path';

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

export const reschedulBookingSchema = z
  .object({
    role: z.enum(Role),
    bookingId: z.uuid(),
    userId: z.uuid(),
    newStartDate: z.coerce.date(),
    newEndDate: z.coerce.date().optional(),
    scheduleId: z.string().optional(),
    reason: z.string().optional(),
  })
  .transform((data) => ({
    ...data,
    newEndDate: data.newEndDate ?? data.newStartDate,
  }))
  .refine(
    (d) => {
      if (!d.newEndDate) return true;
      return (
        new Date(d.newEndDate).getTime() >= new Date(d.newStartDate).getTime()
      );
    },
    {
      message: 'End date must be Greater than the start date',
      path: ['endDate'],
    },
  );

export const cancelBookingSchema = z.object({
  bookingId: z.string(),
  userId: z.string(),
  role: z.enum(Role),
});

export const bookingDetailsSchema = cancelBookingSchema;
