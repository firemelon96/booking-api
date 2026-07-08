"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRentalPricingService = updateRentalPricingService;
exports.deleteRentalPricingService = deleteRentalPricingService;
exports.createRentalPricingService = createRentalPricingService;
const prisma_1 = require("../../../config/prisma");
const rental_item_query_1 = require("../items/rental-item.query");
const rental_pricing_query_1 = require("./rental-pricing.query");
async function updateRentalPricingService({ rentalItemId, pricingId }, { price, pricingType }) {
    const rentalItem = await (0, rental_item_query_1.findRentalItemByIdOrFail)(rentalItemId);
    const rentalPricing = await (0, rental_pricing_query_1.findRentalPricingByIdOrFail)(pricingId);
    if (rentalPricing.rentalItemId !== rentalItem.id) {
        throw new Error('Rental pricing does not belong to the specified rental item');
    }
    return prisma_1.prisma.rentalPricing.update({
        where: { id: pricingId },
        data: {
            price,
            pricingType,
        },
    });
}
async function deleteRentalPricingService({ rentalItemId, pricingId, }) {
    const rentalItem = await (0, rental_item_query_1.findRentalItemByIdOrFail)(rentalItemId);
    const rentalPricing = await (0, rental_pricing_query_1.findRentalPricingByIdOrFail)(pricingId);
    if (rentalPricing.rentalItemId !== rentalItem.id) {
        throw new Error('Rental pricing does not belong to the specified rental item');
    }
    return prisma_1.prisma.rentalPricing.delete({
        where: { id: pricingId },
    });
}
async function createRentalPricingService(rentalItemId, { price, pricingType }) {
    const rentalItem = await (0, rental_item_query_1.findRentalItemByIdOrFail)(rentalItemId);
    return prisma_1.prisma.rentalPricing.create({
        data: {
            price,
            pricingType,
            rentalItemId: rentalItem.id,
        },
    });
}
