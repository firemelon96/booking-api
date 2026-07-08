import z from 'zod';
import {
  rentalItemIdParamsSchema,
  rentalItemsSchema,
} from './rental-item.validator';

export type CreateRentalItemType = z.infer<typeof rentalItemsSchema>;

export type RentalItemIdParams = z.infer<typeof rentalItemIdParamsSchema>;
