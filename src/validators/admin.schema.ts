import z from 'zod';
import { BookingStatus } from '../generated/prisma/enums';

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
