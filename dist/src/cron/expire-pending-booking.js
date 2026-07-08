"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expirePendingBooking = expirePendingBooking;
const prisma_1 = require("../config/prisma");
const booking_service_1 = require("../services/booking.service");
const node_cron_1 = __importDefault(require("node-cron"));
async function expirePendingBooking() {
    node_cron_1.default.schedule('* * * * *', async () => {
        console.log('Running expired booking cleanup...');
        const expiredBookings = await prisma_1.prisma.booking.findMany({
            where: {
                status: 'PENDING',
                expiresAt: { lte: new Date() },
            },
            select: { id: true },
        });
        for (const booking of expiredBookings) {
            await prisma_1.prisma.$transaction(async (tx) => {
                (0, booking_service_1.expireBooking)({ tx, bookingId: booking.id });
            });
        }
    });
}
