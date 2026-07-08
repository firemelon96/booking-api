"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDates = closeDates;
exports.openDates = openDates;
const date_fns_1 = require("date-fns");
const helper_1 = require("../../../utils/helper");
const prisma_1 = require("../../../config/prisma");
async function closeDates({ tourId, startDate, endDate, reason, }) {
    const interval = (0, helper_1.normalizeInterval)(startDate, endDate);
    const dates = (0, date_fns_1.eachDayOfInterval)(interval);
    await prisma_1.prisma.tourAvailability.createMany({
        data: dates.map((date) => ({
            tourId,
            date,
            isClosed: true,
            reason: reason ?? null,
        })),
        skipDuplicates: true,
    });
    await prisma_1.prisma.tourAvailability.updateMany({
        where: {
            tourId,
            date: {
                gte: interval.start,
                lte: interval.end,
            },
        },
        data: {
            isClosed: true,
            reason: reason ?? null,
        },
    });
    return { success: true, blockedDates: dates.length };
}
async function openDates({ tourId, startDate, endDate, reason, }) {
    const interval = (0, helper_1.normalizeInterval)(startDate, endDate);
    await prisma_1.prisma.tourAvailability.updateMany({
        where: {
            tourId,
            date: {
                gte: interval.start,
                lte: interval.end,
            },
        },
        data: {
            isClosed: false,
            reason: reason ?? null,
        },
    });
    return { success: true };
}
