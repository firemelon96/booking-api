import z from 'zod';
import { AccommodationType } from '../../generated/prisma/enums';

export const createAccommodationSchema = z.object({
  name: z.string().min(2),
  type: z.enum(AccommodationType),

  description: z.string().optional(),

  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  country: z.string().optional(),

  latitude: z.number().optional(),
  longitude: z.number().optional(),

  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  hasUnits: z.boolean().default(false),
  isBookable: z.boolean().default(false),
  basePrice: z.number().optional(),
  maxGuests: z.number().optional(),

  amenityIds: z.string().array().optional(),
});

export const updateAccommodationSchema = createAccommodationSchema.partial();

export const accommodationQuerySchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  sort: z.string().optional(),
  search: z.string().optional(),
  type: z.enum(AccommodationType).optional(),
});

export const accommodationSlugParams = z.object({
  slug: z.string(),
});
