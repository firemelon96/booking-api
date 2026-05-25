import z from 'zod';

export const createTransferSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
});

export const transferIdParams = z.object({
  transferId: z.uuid(),
});

//add more after pushing the database online
