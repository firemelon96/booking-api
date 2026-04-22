import z from 'zod';
import {
  BookingStatus,
  CapacityMode,
  TourType,
} from '../generated/prisma/enums';

export const getAllBookingsParamsSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  sort: z.string().optional(),
  search: z.string().optional(),
  tourId: z.string().optional(),
  status: z.enum(BookingStatus).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type GetAllBookingParams = z.infer<typeof getAllBookingsParamsSchema>;

export const getAllTourParamsSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  sort: z.string().optional(),
  search: z.string().optional(),
  capacityMode: z.enum(CapacityMode).optional(),
  type: z.enum(TourType).optional(),
  duration: z.number().optional(),
});

export type GetAllTourParamsType = z.infer<typeof getAllTourParamsSchema>;
