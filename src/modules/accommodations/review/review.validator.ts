import z from 'zod';

export const createReviewSchema = z.object({
  unitId: z.string(),
  comment: z.string().min(2),
  starRating: z.number(),
  imageIds: z.string().array(),
});
