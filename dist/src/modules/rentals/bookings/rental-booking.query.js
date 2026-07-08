"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findRentalItemBookingOrThrow = findRentalItemBookingOrThrow;
const prisma_1 = require("../../../config/prisma");
async function findRentalItemBookingOrThrow(bookingId) {
    const rentalItemBooking = await prisma_1.prisma.rentalBooking.findUnique({
        where: {
            bookingId,
        },
        include: { booking: true, item: true },
    });
    if (!rentalItemBooking) {
        throw new Error('Rental booking not found');
    }
    return rentalItemBooking;
}
