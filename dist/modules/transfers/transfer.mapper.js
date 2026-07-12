"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transferMapper = transferMapper;
function transferMapper(transfer) {
    return {
        name: transfer.name,
        slug: transfer.slug,
        description: transfer.description,
        origin: transfer.origin.name,
        destination: transfer.destination.name,
        priceMode: transfer.pricingMode,
        maxPassengers: transfer.maxPassengers,
        price: transfer.basePrice,
        schedules: transfer.hasSchedule
            ? transfer.schedules.map((s) => ({
                departureTime: s.departureTime,
                maxPassengers: s.maxPassengers,
                active: s.isActive,
            }))
            : [],
        pricing: transfer.pricing.map((p) => ({
            type: p.pricingType,
            price: p.price,
            min: p.minPassengers,
            max: p.maxPassengers,
        })) ?? [],
    };
}
