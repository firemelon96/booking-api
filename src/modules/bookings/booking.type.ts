import z from 'zod';
import {
  bookingDetailsSchema,
  bookingQuerySchema,
  cancelBookingSchema,
  createBookingSchema,
  reschedulBookingSchema,
} from './booking.validators';

export type BookingQueryType = z.infer<typeof bookingQuerySchema>;

export type BookingCreateInput = z.infer<typeof createBookingSchema>;

export type BookingReschedInput = z.infer<typeof reschedulBookingSchema>;

export type BookingCancelInput = z.infer<typeof cancelBookingSchema>;

export type BookingDetailInput = z.infer<typeof bookingDetailsSchema>;
