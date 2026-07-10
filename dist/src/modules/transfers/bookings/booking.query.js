"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findTransferBookingOrThrow = findTransferBookingOrThrow;
const prisma_1 = require("../../../config/prisma");
async function findTransferBookingOrThrow({ bookingId, }) {
    const transferBooking = await prisma_1.prisma.transferBooking.findUnique({
        where: { bookingId },
        include: { booking: true, schedule: true },
    });
    if (!transferBooking) {
        throw new Error('Transfer Booking Not found');
    }
    return transferBooking;
}
