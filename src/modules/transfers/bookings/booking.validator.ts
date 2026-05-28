import z from 'zod';
import { PricingType } from '../../../generated/prisma/enums';

export const createTransferBookingSchema = z.object({
  scheduleId: z.string().optional(),
  travelDate: z.coerce.date(),
  passengers: z.number(),
  pricingType: z.enum(PricingType),
  pickupLocation: z.string().optional(),
  dropoffLocation: z.string().optional(),
});
