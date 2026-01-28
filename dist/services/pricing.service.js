"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateTotalPrice = calculateTotalPrice;
const prisma_1 = require("../config/prisma");
async function calculateTotalPrice(params) {
    const { tourId, pricingType, participants } = params;
    const prices = await prisma_1.prisma.tourPricing.findMany({
        where: {
            tourId,
            pricingType,
        },
        orderBy: [{ minGroupSize: 'asc' }],
    });
    if (!prices.length) {
        throw new Error('No pricing for thi tour and pricing type');
    }
    const matched = prices.find((p) => participants >= p.minGroupSize && participants <= p.maxGroupSize);
    if (!matched) {
        const ranges = prices
            .map((p) => `${p.minGroupSize}-${p.maxGroupSize}`)
            .join(', ');
        throw new Error(`No matching price found for ${participants} participant(s). Supported ranges: ${ranges}`);
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
