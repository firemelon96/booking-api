import z from 'zod';
import { RentalPricingType } from '../../../generated/prisma/enums';

export const createRentalBookingSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  quantity: z.number(),
  pricingType: z.enum(RentalPricingType),
  pickupLocation: z.string().optional(),
  returnLocation: z.string().optional(),
  notes: z.string().optional(),
});

export const rescheduleRentalBookingSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});
