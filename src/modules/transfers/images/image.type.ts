import z from 'zod';
import { setFeaturedParams } from './image.validator';

export type SetFeaturedInput = z.infer<typeof setFeaturedParams>;
