import z from 'zod';

export const imageSchema = z.object({
  existingImageIds: z.string().array(),
  newImageIds: z.string().array(),
});

export const setFeaturedParams = z.object({
  tourId: z.string(),
  imageId: z.string(),
});
