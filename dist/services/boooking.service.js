"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBooking = createBooking;
exports.listMyBookings = listMyBookings;
const prisma_1 = require("../config/prisma");
const helper_1 = require("../utils/helper");
const pricing_service_1 = require("./pricing.service");
const date_fns_1 = require("date-fns");
async function createBooking(params) {
    const { userId, tourId, pricingType, participants } = params;
    const tour = await prisma_1.prisma.tour.findUnique({
        where: { id: tourId },
        select: { id: true, joinerCapacity: true },
    });
    if (!tour)
        throw new Error('Tour not found');
    const requested = (0, helper_1.normalizeInterval)(params.startDate, params.endDate);
    const existingBookings = await prisma_1.prisma.booking.findMany({
        where: {
            tourId,
            OR: [
                {
                    endDate: { not: null, gte: requested.start },
                    startDate: { lte: requested.end },
                },
                {
                    endDate: null,
                    startDate: { gte: requested.start, lte: requested.end },
                },
            ],
        },
        select: {
            id: true,
            pricingType: true,
            participants: true,
            startDate: true,
            endDate: true,
        },
    });
    const normalizedExisting = existingBookings.map((b) => ({
        ...b,
        interval: (0, helper_1.normalizeInterval)(b.startDate, b.endDate),
    }));
    if (pricingType === 'private') {
        const conflict = normalizedExisting.find((b) => (0, helper_1.overlaps)(b.interval, requested));
        if (conflict) {
            throw new Error('Date not available: private booking requires exclusive availability.');
        }
    }
    if (pricingType === 'joiner') {
        const days = (0, date_fns_1.eachDayOfInterval)(requested);
        for (const day of days) {
            const dayInterval = (0, helper_1.normalizeInterval)(day, day);
            const privateConflict = normalizedExisting.find((b) => b.pricingType === 'private' && (0, helper_1.overlaps)(b.interval, dayInterval));
            if (privateConflict) {
                throw new Error('Date not available: private booking exists on the selected date.');
            }
            const used = normalizedExisting.reduce((sum, b) => {
                if (b.pricingType !== 'joiner')
                    return sum;
                return (0, helper_1.overlaps)(b.interval, dayInterval) ? sum + b.participants : sum;
            }, 0);
            if (used + participants > tour.joinerCapacity) {
                const dayStr = day.toISOString().slice(0, 10);
                throw new Error(`Capacity exceeded for ${dayStr}: ${used}/${tour.joinerCapacity} already booked.`);
            }
        }
    }
    const pricing = await (0, pricing_service_1.calculateTotalPrice)({
        tourId,
        pricingType,
        participants,
    });
    const booking = await prisma_1.prisma.booking.create({
        data: {
            userId,
            tourId,
            pricingType,
            participants,
            total: pricing.totalPrice,
            startDate: requested.start,
            endDate: params.endDate ? requested.end : null,
        },
        include: {
            tour: {
                select: { id: true, joinerCapacity: true, name: true, slug: true },
            },
        },
    });
    return booking;
}
async function listMyBookings(userId) {
    return prisma_1.prisma.booking.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
            tour: {
                select: { id: true, name: true, slug: true },
            },
        },
    });
}
