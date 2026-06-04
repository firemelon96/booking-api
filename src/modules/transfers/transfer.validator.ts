import z from 'zod';
import {
  TransferPricingMode,
  TransferType,
} from '../../generated/prisma/enums';
import { transferPricingSchema } from './pricings/pricing.validator';
import { transferScheduleSchema } from './schedules/schedule.validator';

export const createTransferSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  type: z.enum(TransferType),
  originId: z.string(),
  destinationId: z.string(),
  pricingMode: z.enum(TransferPricingMode),
  hasSchedule: z.boolean().optional(),
  pricing: transferPricingSchema.array(),
  schedules: transferScheduleSchema.array().optional(),
  amenityIds: z.string().array(),
  imageIds: z.string().array(),
});

export const baseTransferSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  type: z.enum(TransferType),
  originId: z.string(),
  destinationId: z.string(),
  pricingMode: z.enum(TransferPricingMode),
  maxPassengers: z.number(),
  hasSchedule: z.boolean(),
});

export const updateBaseTransferSchema = baseTransferSchema.partial();

export const transferIdParams = z.object({
  transferId: z.uuid(),
});

export const transferSlugParams = z.object({
  slug: z.string(),
});

export const transferQuerySchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  sort: z.string().optional(),
  search: z.string().optional(),
  type: z.enum(TransferType).optional(),
  pricingMode: z.enum(TransferPricingMode).optional(),
});

//add more after pushing the database online
