"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPricing = createPricing;
exports.modifyPricing = modifyPricing;
const prisma_1 = require("../../../config/prisma");
const tour_query_1 = require("../tour.query");
const pricing_rule_1 = require("./pricing.rule");
async function createPricing(tx, tourId, pricing) {
    return tx.tourPricing.createMany({
        data: pricing.map((p) => ({
            ...p,
            tourId,
        })),
    });
}
async function modifyPricing(tourId, pricing) {
    const tour = await (0, tour_query_1.findTourOrFail)(tourId);
    (0, pricing_rule_1.validatePricingRules)(tour.capacityMode, pricing);
    return prisma_1.prisma.$transaction(async (tx) => {
        await tx.tourPricing.deleteMany({ where: { tourId: tour.id } });
        return tx.tourPricing.createMany({
            data: pricing.map((p) => ({
                ...p,
                tourId: tour.id,
            })),
        });
    });
}
