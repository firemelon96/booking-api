"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTourAvailability = getTourAvailability;
const prisma_1 = require("../config/prisma");
const date_fns_1 = require("date-fns");
const helper_1 = require("../utils/helper");
function dayKey(d) {
    return d.toISOString().slice(0, 10);
}
async function getTourAvailability(params) {
    const { tourId, start, end, pricingType } = params;
    const tour = await prisma_1.prisma.tour.findUnique({
        where: { id: tourId },
        select: { id: true, joinerCapacity: true },
    });
    if (!tour)
        throw new Error('Tour not found');
    const range = (0, helper_1.normalizeInterval)((0, date_fns_1.parseISO)(start), (0, date_fns_1.parseISO)(end));
    const days = (0, date_fns_1.eachDayOfInterval)(range);
    const bookings = await prisma_1.prisma.booking.findMany({
        where: {
            tourId,
            OR: [
                {
                    endDate: { not: null, gte: range.start },
                    startDate: { lte: range.end },
                },
                {
                    endDate: null,
                    startDate: { gte: range.start, lte: range.end },
                },
            ],
            ...(pricingType ? { pricingType } : {}),
        },
        select: {
            pricingType: true,
            participants: true,
            startDate: true,
            endDate: true,
        },
    });
    const normalized = bookings.map((b) => ({
        ...b,
        interval: (0, helper_1.normalizeInterval)(b.startDate, b.endDate),
    }));
    const availability = days.map((day) => {
        const dayInterval = (0, helper_1.normalizeInterval)(day, day);
        const hasPrivate = normalized.some((b) => b.pricingType === 'private' && (0, helper_1.overlaps)(b.interval, dayInterval));
        const usedJoiner = normalized.reduce((sum, b) => {
            if (b.pricingType !== 'joiner')
                return sum;
            return (0, helper_1.overlaps)(b.interval, dayInterval) ? sum + b.participants : sum;
        }, 0);
        const joinerRemaining = Math.max(0, tour.joinerCapacity - usedJoiner);
        return {
            date: dayKey(day),
            privateAvailable: !hasPrivate,
            joinerRemaining,
            joinerAvailable: !hasPrivate && joinerRemaining > 0,
        };
    });
    return availability;
}
