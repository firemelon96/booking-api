import { prisma } from '../config/prisma';
import { PricingType } from '../types/pricing-type';

export async function calculateTotalPrice(params: {
  tourId: string;
  pricingType: PricingType;
  participants: number;
}) {
  const { tourId, pricingType, participants } = params;

  const prices = await prisma.tourPricing.findMany({
    where: {
      tourId,
      pricingType,
    },
    orderBy: [{ minGroupSize: 'asc' }],
  });

  if (!prices.length) {
    throw new Error('No pricing for this tour and pricing type');
  }

  const matched = prices.find(
    (p) => participants >= p.minGroupSize && participants <= p.maxGroupSize,
  );

  if (!matched) {
    const ranges = prices
      .map((p) => `${p.minGroupSize}-${p.maxGroupSize}`)
      .join(', ');
    throw new Error(
      `No matching price found for ${participants} participant(s). Supported ranges: ${ranges}`,
    );
  }

  const totalPrice = matched.isGroupPrice
    ? matched.price
    : matched.price * participants;

  return {
    matchedPricing: matched,
    totalPrice,
    currency: 'PHP',
  };
}
