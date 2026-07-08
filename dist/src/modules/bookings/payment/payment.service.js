"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentIntent = createPaymentIntent;
const prisma_1 = require("../../../config/prisma");
const xendit_service_1 = require("../../webhooks/xendit/xendit.service");
const booking_query_1 = require("../booking.query");
async function createPaymentIntent({ bookingId, userId, }) {
    const booking = await (0, booking_query_1.findBookingOrThrow)({ bookingId, role: 'USER', userId });
    if (!booking) {
        throw new Error('Booking not found');
    }
    if (booking.bookingStatus === 'EXPIRED' ||
        booking.bookingStatus === 'CANCELLED') {
        throw new Error('Cannot book expired or cancelled');
    }
    const invoice = await (0, xendit_service_1.createXenditInvoice)({
        bookingId,
        amount: Number(booking.totalPrice),
        externalId: `created-${bookingId}-${Date.now()}`,
        type: 'CREATED',
    });
    return prisma_1.prisma.paymentTransation.create({
        data: {
            bookingId,
            type: 'INITIAL_PAYMENT',
            amount: invoice.amount,
            paymentStatus: 'PENDING',
            xenditInvoiceId: invoice.id,
            invoiceUrl: invoice.invoiceUrl,
            expiresAt: invoice.expiryDate,
        },
    });
}
