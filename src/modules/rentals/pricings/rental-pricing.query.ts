import { differenceInCalendarDays, differenceInHours } from 'date-fns';
import { prisma } from '../../../config/prisma';
import { RentalPricingType } from '../../../generated/prisma/enums';

export async function findRentalPricingByIdOrFail(pricingId: string) {
  const rentalPricing = await prisma.rentalPricing.findUnique({
    where: { id: pricingId },
  });

  if (!rentalPricing) {
    throw new Error('Rental pricing not found');
  }

  return rentalPricing;
}

export function calculateRentalPrice({
  rentalItem,
  pricingType,
  quantity,
  startDate,
  endDate,
}: {
  rentalItem: any;
  pricingType: RentalPricingType;
  quantity: number;
  startDate: Date;
  endDate: Date;
}) {
  const pricing = rentalItem.pricing.find(
    (p: any) => p.pricingType === pricingType,
  );

  if (!pricing) {
    throw new Error('Pricing not found');
  }

  const days = differenceInCalendarDays(endDate, startDate);

  switch (pricingType) {
    case 'DAILY':
      return Number(pricing.price) * days * quantity;

    case 'WEEKLY':
      return Number(pricing.price) * Math.ceil(days / 7) * quantity;

    case 'HOURLY':
      const hours = differenceInHours(endDate, startDate);
      return Number(pricing.price) * hours * quantity;

    default:
      throw new Error('Invalid pricing');
  }
}
