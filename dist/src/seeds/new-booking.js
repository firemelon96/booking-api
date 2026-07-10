"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBooking = createBooking;
const prisma_1 = require("../config/prisma");
async function createBooking({ participants, pricingType, startDate, tourId, userId, scheduleId, }) {
    return prisma_1.prisma.booking.create({
        data: {
            status: 'CONFIRMED',
            startDate,
            participants,
            pricingType,
            tourId,
            scheduleId,
            userId,
        },
    });
}
