import z, { TypeOf } from 'zod';
import { createReviewSchema } from './review.validator';

export type ReviewInput = z.infer<typeof createReviewSchema>;
