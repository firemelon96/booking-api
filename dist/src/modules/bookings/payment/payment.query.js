"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentTransaction = createPaymentTransaction;
exports.createInitialBookingPayment = createInitialBookingPayment;
exports.updateBookingPaymentSummary = updateBookingPaymentSummary;
exports.createRescheduleAdjustmentPayment = createRescheduleAdjustmentPayment;
exports.handleXenditInvoicePayment = handleXenditInvoicePayment;
const prisma_1 = require("../../../config/prisma");
const xendit_service_1 = require("../../webhooks/xendit/xendit.service");
const booking_query_1 = require("../booking.query");
async function createPaymentTransaction({ tx, bookingId, type, amount, paymentStatus = 'PENDING', xenditInvoiceId, invoiceUrl, description, expiresAt, metadata, }) {
    return tx.paymentTransation.create({
        data: {
            bookingId,
            type,
            amount,
            paymentStatus,
            xenditInvoiceId,
            invoiceUrl,
            description,
            expiresAt,
            metadata,
        },
    });
}
async function createInitialBookingPayment(tx, { amount, bookingId, type, description, expiresAt, }) {
    const invoice = await (0, xendit_service_1.createXenditInvoice)({
        bookingId,
        amount,
        type: 'CREATED',
        externalId: `booking-${bookingId}`,
    });
    return createPaymentTransaction({
        tx,
        bookingId,
        type,
        amount,
        xenditInvoiceId: invoice.id,
        invoiceUrl: invoice.invoiceUrl,
        expiresAt,
        description,
    });
}
async function updateBookingPaymentSummary(tx, bookingId) {
    const booking = await (0, booking_query_1.findBookingById)(bookingId);
    const transactions = await tx.paymentTransation.findMany({
        where: {
            bookingId: booking.id,
            paymentStatus: {
                in: ['PAID', 'PARTIALLY_REFUNDED'],
            },
        },
    });
    let paidAmount = 0;
    for (const transaction of transactions) {
        switch (transaction.type) {
            case 'INITIAL_PAYMENT':
            case 'ADDITIONAL_PAYMENT':
            case 'MANUAL_ADJUSTMENT':
                paidAmount += Number(transaction.amount);
                break;
            case 'REFUND':
                paidAmount -= Number(transaction.amount);
                break;
        }
    }
    const remainingBalance = Number(booking.totalPrice) - paidAmount;
    let paymentStatus = 'PENDING';
    if (paidAmount <= 0) {
        paymentStatus = 'PENDING';
    }
    else if (remainingBalance > 0) {
        paymentStatus = 'PENDING';
    }
    else {
        paymentStatus = 'PAID';
    }
    return tx.booking.update({
        where: {
            id: bookingId,
        },
        data: {
            paidAmount,
            remainingBalance,
            paymentStatus,
        },
    });
}
async function createRescheduleAdjustmentPayment({ tx, bookingId, amount, customer, }) {
    if (amount <= 0) {
        return null;
    }
    const invoice = await (0, xendit_service_1.createXenditInvoice)({
        bookingId,
        amount,
        externalId: `reschedule-${bookingId}-${Date.now()}`,
        type: 'RESCHEDULED',
    });
    return tx.paymentTransation.create({
        data: {
            bookingId,
            type: 'ADDITIONAL_PAYMENT',
            amount,
            xenditInvoiceId: invoice.id,
            invoiceUrl: invoice.invoiceUrl,
            description: 'Reschedule payment adjustment',
            metadata: {
                reason: 'BOOKING_RESCHEDULE',
            },
        },
    });
}
async function handleXenditInvoicePayment(xenditInvoiceId) {
    return prisma_1.prisma.$transaction(async (tx) => {
        const transaction = await tx.paymentTransation.findFirst({
            where: {
                xenditInvoiceId,
            },
            include: {
                booking: true,
            },
        });
        if (!transaction) {
            throw new Error('Transaction not found');
        }
        if (transaction.paymentStatus === 'PAID') {
            return transaction;
        }
        await tx.paymentTransation.update({
            where: {
                id: transaction.id,
            },
            data: {
                paymentStatus: 'PAID',
                paidAt: new Date(),
            },
        });
        await updateBookingPaymentSummary(tx, transaction.bookingId);
        return transaction;
    });
}
