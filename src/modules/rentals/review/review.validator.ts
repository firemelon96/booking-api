import z from 'zod';

export const createReviewSchema = z.object({
  comment: z.string().min(2),
  starRating: z.number(),
  imageIds: z.string().array(),
});
