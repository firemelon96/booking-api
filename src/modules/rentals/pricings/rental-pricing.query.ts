import { prisma } from '../../../config/prisma';

export async function findRentalPricingByIdOrFail(pricingId: string) {
  const rentalPricing = await prisma.rentalPricing.findUnique({
    where: { id: pricingId },
  });

  if (!rentalPricing) {
    throw new Error('Rental pricing not found');
  }

  return rentalPricing;
}
