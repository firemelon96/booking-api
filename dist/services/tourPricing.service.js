"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTourPricing = listTourPricing;
exports.createTourPricing = createTourPricing;
exports.updateTourPricing = updateTourPricing;
exports.deleteTourPricing = deleteTourPricing;
const prisma_1 = require("../config/prisma");
function rangesOverlap(aMin, aMax, bmin, bMax) {
    return Math.max(aMin, bmin) <= Math.min(aMax, bMax);
}
async function listTourPricing(tourId) {
    const tour = await prisma_1.prisma.tour.findUnique({ where: { id: tourId } });
    if (!tour)
        throw new Error('Tour not found');
    return prisma_1.prisma.tourPricing.findMany({
        where: { tourId },
        orderBy: [{ pricingType: 'asc' }, { minGroupSize: 'asc' }],
    });
}
async function assertNoOverlap(params) {
    const existing = await prisma_1.prisma.tourPricing.findMany({
        where: {
            tourId: params.tourId,
            pricingType: params.pricingType,
            ...(params.ignoreId ? { NOT: { id: params.ignoreId } } : {}),
        },
        select: { id: true, minGroupSize: true, maxGroupSize: true },
    });
    const conflict = existing.find((p) => rangesOverlap(params.minGroupSize, params.maxGroupSize, p.minGroupSize, p.maxGroupSize));
    if (conflict) {
        throw new Error(`Pricing range overlaps with existing range ${conflict.minGroupSize}-${conflict.maxGroupSize}`);
    }
}
async function createTourPricing(params) {
    const tour = await prisma_1.prisma.tour.findUnique({ where: { id: params.tourId } });
    if (!tour)
        throw new Error('Tour not found');
    await assertNoOverlap({
        tourId: params.tourId,
        pricingType: params.pricingType,
        minGroupSize: params.minGroupSize,
        maxGroupSize: params.maxGroupSize,
    });
    return prisma_1.prisma.tourPricing.create({
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
async function updateTourPricing(params) {
    const existing = await prisma_1.prisma.tourPricing.findUnique({
        where: { id: params.pricingId },
    });
    if (!existing || existing.tourId !== params.tourId) {
        throw new Error('Pricing not found for this tour');
    }
    const nextPricingType = params.pricingType ?? existing.pricingType;
    const nextMin = params.minGroupSize ?? existing.minGroupSize;
    const nextMax = params.maxGroupSize ?? existing.maxGroupSize;
    if (nextMin > nextMax)
        throw new Error('Min group size must be less than or equal to max group size');
    await assertNoOverlap({
        tourId: params.tourId,
        pricingType: nextPricingType,
        minGroupSize: nextMin,
        maxGroupSize: nextMax,
        ignoreId: params.pricingId,
    });
    return prisma_1.prisma.tourPricing.update({
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
async function deleteTourPricing(params) {
    const existing = await prisma_1.prisma.tourPricing.findUnique({
        where: { id: params.pricingId },
    });
    if (!existing || existing.tourId !== params.tourId) {
        throw new Error('Pricing not found for this tour');
    }
    await prisma_1.prisma.tourPricing.delete({ where: { id: params.pricingId } });
}
