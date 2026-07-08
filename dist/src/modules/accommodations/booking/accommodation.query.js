"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findAccommodationBookingOrThrow = findAccommodationBookingOrThrow;
const prisma_1 = require("../../../config/prisma");
async function findAccommodationBookingOrThrow({ bookingId, role, userId, }) {
    const accommodationBooking = await prisma_1.prisma.accommodationBooking.findUnique({
        where: {
            bookingId,
            ...(role === 'USER' ? { userId } : {}),
        },
        include: {
            accommodation: true,
            booking: {
                include: { user: true },
            },
            unit: true,
        },
    });
    if (!accommodationBooking) {
        throw new Error('Accommodation booking does not exist');
    }
    return accommodationBooking;
}
