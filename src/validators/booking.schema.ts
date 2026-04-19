import { schedule } from 'node-cron';
import { z } from 'zod';
import { CapacityMode, PricingType, TourType } from '../generated/prisma/enums';

export const createBookingSchema = z
  .object({
    tourId: z.uuid(),
    pricingType: z.enum(['JOINER', 'PRIVATE']),
    participants: z.number().int().min(1).max(100),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    scheduleId: z.string().optional(),
    notes: z.string().optional(),
  })
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

export const rescheduleBookingSchema = z
  .object({
    newStartDate: z.coerce.date(),
    newEndDate: z.coerce.date().optional(),
    scheduleId: z.string().optional(),
    reason: z.string().optional(),
  })
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

export const reserveSchema = z.object({
  tour: z.object({
    id: z.uuid(),
    capacityMode: z.enum(CapacityMode),
    joinerCapacity: z.number().optional(),
    type: z.enum(TourType),
  }),
  pricingType: z.enum(PricingType),
  participants: z.number(),
  interval: z.object({
    start: z.coerce.date(),
    end: z.coerce.date(),
  }),
  scheduleId: z.string().optional(),
  excludeBookingId: z.string().optional(),
});
