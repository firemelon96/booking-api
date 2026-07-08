import z from 'zod';
import {
  bookingQuerySchema,
  bookingSchema,
  reschedulBookingSchema,
} from './booking.validators';

export type BookingQueryType = z.infer<typeof bookingQuerySchema>;

export type RescheduleBookingPayload = z.infer<typeof reschedulBookingSchema>;

export type BookingInputType = z.infer<typeof bookingSchema>;
