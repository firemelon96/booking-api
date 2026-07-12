"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.xenditPayment = xenditPayment;
exports.createXenditInvoice = createXenditInvoice;
const prisma_1 = require("../../../config/prisma");
const xendit_1 = __importDefault(require("../../../config/xendit"));
const booking_audit_service_1 = require("../../bookings/audit/booking-audit.service");
const payment_query_1 = require("../../bookings/payment/payment.query");
async function xenditPayment(signature, xenditInvoiceId, invoiceStatus) {
    if (signature !== process.env.XENDIT_WEBHOOK_SECRET) {
        throw new Error('Unauthorized webhhook');
    }
    const transaction = await prisma_1.prisma.paymentTransation.findFirst({
        where: { xenditInvoiceId },
        include: { booking: true },
    });
    if (!transaction) {
        throw new Error('Payment transaction not found');
    }
    if (transaction.paymentStatus === 'PAID' && invoiceStatus === 'PAID') {
        return {
            success: true,
            message: 'Webhook already processed',
        };
    }
    let paymentStatus = 'PENDING';
    switch (invoiceStatus) {
        case 'PAID':
            paymentStatus = 'PAID';
            break;
        case 'EXPIRED':
            paymentStatus = 'EXPIRED';
            break;
        case 'FAILED':
            paymentStatus = 'FAILED';
            break;
        default:
            paymentStatus = 'PENDING';
    }
    return prisma_1.prisma.$transaction(async (tx) => {
        const updatedTransaction = await tx.paymentTransation.update({
            where: {
                id: transaction.id,
            },
            data: {
                paymentStatus,
                ...(paymentStatus === 'PAID' ? { paidAt: new Date() } : {}),
            },
        });
        const updatedBooking = await (0, payment_query_1.updateBookingPaymentSummary)(tx, transaction.bookingId);
        let bookingStatus = updatedBooking.bookingStatus;
        if (transaction.type === 'INITIAL_PAYMENT' && paymentStatus === 'PAID') {
            bookingStatus = 'CONFIRMED';
        }
        if (transaction.type === 'ADDITIONAL_PAYMENT' && paymentStatus === 'PAID') {
            if (Number(updatedBooking.remainingBalance) <= 0) {
                bookingStatus = 'CONFIRMED';
            }
        }
        if (transaction.type === 'INITIAL_PAYMENT' &&
            ['FAILED', 'EXPIRED'].includes(paymentStatus)) {
            bookingStatus = 'CANCELLED';
        }
        const finalBooking = await tx.booking.update({
            where: { id: transaction.bookingId },
            data: {
                bookingStatus,
            },
        });
        // PAYMENT_WEBHOOK_UPDATED enum,
        await (0, booking_audit_service_1.logBookingAction)({
            tx,
            action: 'PAYMENT_WEBHOOK_UPDATED',
            role: 'ADMIN',
            newValue: {
                transactionId: transaction.id,
                transactionType: transaction.type,
                xenditInvoiceId,
                invoiceStatus,
                paymentStatus,
                bookingStatus,
            },
        });
        return {
            success: true,
            booking: finalBooking,
            transaction: updatedTransaction,
        };
    });
}
async function createXenditInvoice({ bookingId, amount, type, externalId, }) {
    const invoice = await xendit_1.default.Invoice.createInvoice({
        data: {
            externalId,
            amount: amount,
            description: `Payment for booking ${type}: ${bookingId}`,
            invoiceDuration: 3600, // 1 hour,
            currency: 'PHP',
            successRedirectUrl: `${process.env.FRONTEND_URL}/payment-success?bookingId=${bookingId}`,
            failureRedirectUrl: `${process.env.FRONTEND_URL}/payment-failure?bookingId=${bookingId}`,
        },
    });
    if (!invoice) {
        throw new Error('Failed to create invoice');
    }
    return invoice;
}
