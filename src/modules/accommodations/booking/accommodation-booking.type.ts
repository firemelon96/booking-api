import z from 'zod';
import { createAccommodationBookingSchema } from './accommodation-booking.validator';

export type CreateAccommodationBookingType = z.infer<
  typeof createAccommodationBookingSchema
>;
