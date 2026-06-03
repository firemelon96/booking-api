import { prisma } from '../../../config/prisma';
import { findRentalItemByIdOrFail } from '../items/rental-item.query';
import { findRentalPricingByIdOrFail } from './rental-pricing.query';
import {
  CreateRentalPricingData,
  UpdateRentalPricingData,
} from './rental-pricing.type';

export async function updateRentalPricingService(
  { rentalItemId, pricingId }: { rentalItemId: string; pricingId: string },
  { price, pricingType }: UpdateRentalPricingData,
) {
  const rentalItem = await findRentalItemByIdOrFail(rentalItemId);

  const rentalPricing = await findRentalPricingByIdOrFail(pricingId);

  if (rentalPricing.rentalItemId !== rentalItem.id) {
    throw new Error(
      'Rental pricing does not belong to the specified rental item',
    );
  }

  return prisma.rentalPricing.update({
    where: { id: pricingId },
    data: {
      price,
      pricingType,
    },
  });
}

export async function deleteRentalPricingService({
  rentalItemId,
  pricingId,
}: {
  rentalItemId: string;
  pricingId: string;
}) {
  const rentalItem = await findRentalItemByIdOrFail(rentalItemId);

  const rentalPricing = await findRentalPricingByIdOrFail(pricingId);

  if (rentalPricing.rentalItemId !== rentalItem.id) {
    throw new Error(
      'Rental pricing does not belong to the specified rental item',
    );
  }

  return prisma.rentalPricing.delete({
    where: { id: pricingId },
  });
}

export async function createRentalPricingService(
  rentalItemId: string,
  { price, pricingType }: CreateRentalPricingData,
) {
  const rentalItem = await findRentalItemByIdOrFail(rentalItemId);

  return prisma.rentalPricing.create({
    data: {
      price,
      pricingType,
      rentalItemId: rentalItem.id,
    },
  });
}
