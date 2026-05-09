import z from 'zod';
import { Role } from '../../generated/prisma/enums';

export const userQuerySchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  sort: z.string().optional(),
  search: z.string().optional(),
  role: z.enum(Role).optional(),
});
