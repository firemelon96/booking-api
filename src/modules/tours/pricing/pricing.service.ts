import { prisma } from '../../../config/prisma';
import { Prisma } from '../../../generated/prisma/client';
import { findTourOrFail } from '../tour.query';
import { validatePricingRules } from './pricing.rule';
import { PricingType } from './pricing.type';

export async function createPricing(
  tx: Prisma.TransactionClient,
  tourId: string,
  pricing: PricingType[],
) {
  return tx.tourPricing.createMany({
    data: pricing.map((p) => ({
      ...p,
      tourId,
    })),
  });
}

export async function modifyPricing(tourId: string, pricing: PricingType[]) {
  const tour = await findTourOrFail(tourId);

  validatePricingRules(tour.capacityMode, pricing);

  return prisma.$transaction(async (tx) => {
    await tx.tourPricing.deleteMany({ where: { tourId } });

    return tx.tourPricing.createMany({
      data: pricing.map((p) => ({
        ...p,
        tourId,
      })),
    });
  });
}
