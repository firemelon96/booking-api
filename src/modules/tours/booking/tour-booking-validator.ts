import z from 'zod';
import { PricingType, Role } from '../../../generated/prisma/enums';

export const tourReschedPayload = z.object({
  newStartDate: z.coerce.date(),
  newEndDate: z.coerce.date(),
  scheduleId: z.string().optional(),
});

export const createTourBookingSchema = z.object({
  pricingType: z.enum(PricingType),
  participants: z.number().int().min(1).max(100),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  scheduleId: z.string().optional(),
  notes: z.string().optional(),
});
