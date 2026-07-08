import z from 'zod';

export const transferScheduleSchema = z.object({
  departureTime: z.string(),
  maxPassengers: z.number(),
});
