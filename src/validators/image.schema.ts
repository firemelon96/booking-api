import { z } from 'zod';

export const imageSchema = z.object({
  id: z.string().optional(),
  tourId: z.string().optional(),
  url: z.string(),
  public_Id: z.string(),
});

export type ImageType = z.infer<typeof imageSchema>;

//optional
