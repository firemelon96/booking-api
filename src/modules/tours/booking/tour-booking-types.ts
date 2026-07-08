import z from 'zod';
import {
  createTourBookingSchema,
  tourReschedPayload,
} from './tour-booking-validator';

export type TourReschedPayload = z.infer<typeof tourReschedPayload>;

export type TourBookingCreateInput = z.infer<typeof createTourBookingSchema>;
