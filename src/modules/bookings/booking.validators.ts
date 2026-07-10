import z from 'zod';
import {
  BookingStatus,
  ServiceType,
  PaymentStatus,
  PricingType,
  Role,
} from '../../generated/prisma/enums';

export const bookingIdParams = z.object({
  bookingId: z.string(),
});

export const bookingQuerySchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  sort: z.string().optional(),
  search: z.string().optional(),
  reference: z.string().optional(),
  type: z.enum(ServiceType).optional(),
  bookingStatus: z.enum(BookingStatus).optional(),
  paymentStatus: z.enum(PaymentStatus).optional(),
  totalPrice: z.number().optional(),
  paidAmount: z.number().optional(),
  remainingBalance: z.number().optional(),
});

export const reschedulBookingSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  scheduleId: z.string().optional(),

  travelDate: z.coerce.date().optional(),

  checkIn: z.coerce.date().optional(),
  checkOut: z.coerce.date().optional(),
  reason: z.string().optional(),
});

export const bookingSchema = z.object({
  bookingId: z.string(),
  userId: z.string(),
  role: z.enum(Role),
});
