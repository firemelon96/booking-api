import { prisma } from '../../../config/prisma';
import { Prisma } from '../../../generated/prisma/client';
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
