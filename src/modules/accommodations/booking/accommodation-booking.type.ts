import z from 'zod';
import {
  createAccommodationBookingSchema,
  rescheduleAccommodationBookingSchema,
} from './accommodation-booking.validator';

export type CreateAccommodationBookingType = z.infer<
  typeof createAccommodationBookingSchema
>;

export type RescheduleAccommodationBookingType = z.infer<
  typeof rescheduleAccommodationBookingSchema
>;
