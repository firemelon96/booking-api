import z from 'zod';
import {
  createRentalBookingSchema,
  rescheduleRentalBookingSchema,
} from './rental-booking.validator';

export type CreateRentalBooking = z.infer<typeof createRentalBookingSchema>;

export type RescheduleRentalBooking = z.infer<
  typeof rescheduleRentalBookingSchema
>;
