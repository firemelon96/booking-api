"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculate = calculate;
async function calculate({ tx, tourId, pricingType, participants, }) {
    const pricingList = await tx.tourPricing.findMany({
        where: { tourId, pricingType },
    });
    const pricing = pricingList.find((p) => {
        if (!p.maxGroupSize && !p.maxGroupSize)
            return true;
        return (participants >= (p.minGroupSize ?? 0) &&
            participants <= (p.maxGroupSize ?? Infinity));
    });
    if (!pricing)
        throw new Error('No pricing available for this group size');
    if (pricing.pricingModel === 'PER_PERSON') {
        return { totalPrice: pricing.price * participants };
    }
    if (pricing.pricingModel === 'PER_GROUP') {
        return { totalPrice: pricing.price };
    }
    throw new Error('Invalid pricing model');
}
