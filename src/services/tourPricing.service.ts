import { prisma } from '../config/prisma';

type PricingType = 'joiner' | 'private';

function rangesOverlap(aMin: number, aMax: number, bmin: number, bMax: number) {
  return Math.max(aMin, bmin) <= Math.min(aMax, bMax);
}

export async function listTourPricing(tourId: string) {
  const tour = await prisma.tour.findUnique({ where: { id: tourId } });

  if (!tour) throw new Error('Tour not found');

  return prisma.tourPricing.findMany({
    where: { tourId },
    orderBy: [{ pricingType: 'asc' }, { minGroupSize: 'asc' }],
  });
}

async function assertNoOverlap(params: {
  tourId: string;
  pricingType: PricingType;
  minGroupSize: number;
  maxGroupSize: number;
  ignoreId?: string;
}) {
  const existing = await prisma.tourPricing.findMany({
    where: {
      tourId: params.tourId,
      pricingType: params.pricingType,
      ...(params.ignoreId ? { NOT: { id: params.ignoreId } } : {}),
    },
    select: { id: true, minGroupSize: true, maxGroupSize: true },
  });

  const conflict = existing.find((p) =>
    rangesOverlap(
      params.minGroupSize,
      params.maxGroupSize,
      p.minGroupSize,
      p.maxGroupSize,
    ),
  );

  if (conflict) {
    throw new Error(
      `Pricing range overlaps with existing range ${conflict.minGroupSize}-${conflict.maxGroupSize}`,
    );
  }
}

export async function createTourPricing(params: {
  tourId: string;
  pricingType: PricingType;
  minGroupSize: number;
  maxGroupSize: number;
  price: number;
  isGroupPrice: boolean;
}) {
  const tour = await prisma.tour.findUnique({ where: { id: params.tourId } });

  if (!tour) throw new Error('Tour not found');

  await assertNoOverlap({
    tourId: params.tourId,
    pricingType: params.pricingType,
    minGroupSize: params.minGroupSize,
    maxGroupSize: params.maxGroupSize,
  });

  return prisma.tourPricing.create({
    data: {
      tourId: params.tourId,
      pricingType: params.pricingType,
      minGroupSize: params.minGroupSize,
      maxGroupSize: params.maxGroupSize,
      price: params.price,
      isGroupPrice: params.isGroupPrice,
    },
  });
}

export async function updateTourPricing(params: {
  tourId: string;
  pricingId: string;
  pricingType?: PricingType;
  minGroupSize?: number;
  maxGroupSize?: number;
  price?: number;
  isGroupPrice?: boolean;
}) {
  const existing = await prisma.tourPricing.findUnique({
    where: { id: params.pricingId },
  });

  if (!existing || existing.tourId !== params.tourId) {
    throw new Error('Pricing not found for this tour');
  }

  const nextPricingType = params.pricingType ?? existing.pricingType;
  const nextMin = params.minGroupSize ?? existing.minGroupSize;
  const nextMax = params.maxGroupSize ?? existing.maxGroupSize;

  if (nextMin > nextMax)
    throw new Error(
      'Min group size must be less than or equal to max group size',
    );

  await assertNoOverlap({
    tourId: params.tourId,
    pricingType: nextPricingType,
    minGroupSize: nextMin,
    maxGroupSize: nextMax,
    ignoreId: params.pricingId,
  });

  return prisma.tourPricing.update({
    where: { id: params.pricingId },
    data: {
      pricingType: params.pricingType,
      minGroupSize: params.minGroupSize,
      maxGroupSize: params.maxGroupSize,
      price: params.price,
      isGroupPrice: params.isGroupPrice,
    },
  });
}

export async function deleteTourPricing(params: {
  tourId: string;
  pricingId: string;
}) {
  const existing = await prisma.tourPricing.findUnique({
    where: { id: params.pricingId },
  });

  if (!existing || existing.tourId !== params.tourId) {
    throw new Error('Pricing not found for this tour');
  }

  await prisma.tourPricing.delete({ where: { id: params.pricingId } });
}
