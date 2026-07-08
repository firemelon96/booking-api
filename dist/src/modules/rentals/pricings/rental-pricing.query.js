"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findRentalPricingByIdOrFail = findRentalPricingByIdOrFail;
exports.calculateRentalPrice = calculateRentalPrice;
const date_fns_1 = require("date-fns");
const prisma_1 = require("../../../config/prisma");
async function findRentalPricingByIdOrFail(pricingId) {
    const rentalPricing = await prisma_1.prisma.rentalPricing.findUnique({
        where: { id: pricingId },
    });
    if (!rentalPricing) {
        throw new Error('Rental pricing not found');
    }
    return rentalPricing;
}
function calculateRentalPrice({ rentalItem, pricingType, quantity, startDate, endDate, }) {
    const pricing = rentalItem.pricing.find((p) => p.pricingType === pricingType);
    if (!pricing) {
        throw new Error('Pricing not found');
    }
    const days = (0, date_fns_1.differenceInCalendarDays)(endDate, startDate);
    switch (pricingType) {
        case 'DAILY':
            return Number(pricing.price) * days * quantity;
        case 'WEEKLY':
            return Number(pricing.price) * Math.ceil(days / 7) * quantity;
        case 'HOURLY':
            const hours = (0, date_fns_1.differenceInHours)(endDate, startDate);
            return Number(pricing.price) * hours * quantity;
        default:
            throw new Error('Invalid pricing');
    }
}
