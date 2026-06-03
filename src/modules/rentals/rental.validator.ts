import z from 'zod';
import { RentalType } from '../../generated/prisma/enums';
import { rentalItemsSchema } from './items/rental-item.validator';

export const rentalIdParamsSchema = z.object({
  rentalId: z.string(),
});

export const rentalSlugParamsSchema = z.object({
  slug: z.string(),
});

export const createRentalBodySchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  type: z.enum(RentalType),
  amenityIds: z.string().array(),
  items: z.array(rentalItemsSchema),
});

export const updateRentalBodySchema = z
  .object({
    name: z.string(),
    description: z.string().optional(),
    type: z.enum(RentalType),
    amenityIds: z.array(z.string()).optional(),
  })
  .partial();

export const rentalQuerySchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  sort: z.string().optional(),
  search: z.string().optional(),
  type: z.enum(RentalType).optional(),
});
