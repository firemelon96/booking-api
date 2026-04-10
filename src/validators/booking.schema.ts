import { schedule } from 'node-cron';
import { z } from 'zod';

export const createBookingSchema = z
  .object({
    tourId: z.uuid(),
    pricingType: z.enum(['JOINER', 'PRIVATE']),
    participants: z.number().int().min(1).max(100),
    startDate: z.iso.datetime(),
    endDate: z.iso.datetime().optional(),
    scheduleId: z.string().optional(),
    notes: z.string().optional(),
    type: z.enum(['DAY', 'PACKAGE']).optional(),
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
  )
  .refine(
    (d) => {
      if (d.type === 'DAY') return !d.endDate;
      return true;
    },
    {
      message: 'Day bookings must be single-day (no end date).',
      path: ['endDate'],
    },
  );

export const rescheduleBookingSchema = z
  .object({
    newStartDate: z.iso.datetime(),
    newEndDate: z.iso.datetime().optional(),
    newScheduleId: z.string().optional(),
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
