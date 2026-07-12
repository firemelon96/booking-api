"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRentalBookingService = createRentalBookingService;
exports.rescheduleRentalItemBookingService = rescheduleRentalItemBookingService;
exports.cancelRentalBooking = cancelRentalBooking;
const date_fns_1 = require("date-fns");
const helper_1 = require("../../../utils/helper");
const rental_item_query_1 = require("../items/rental-item.query");
const rental_query_1 = require("../rental.query");
const prisma_1 = require("../../../config/prisma");
const booking_query_1 = require("../../bookings/booking.query");
const rental_inventory_service_1 = require("../inventories/rental-inventory.service");
const payment_query_1 = require("../../bookings/payment/payment.query");
const booking_audit_service_1 = require("../../bookings/audit/booking-audit.service");
const rental_pricing_query_1 = require("../pricings/rental-pricing.query");
const rental_booking_query_1 = require("./rental-booking.query");
const booking_rule_1 = require("../../bookings/booking.rule");
async function createRentalBookingService(userId, role, { itemId, rentalId }, { endDate, pricingType, quantity, startDate, notes, pickupLocation, returnLocation, }) {
    const isAdmin = role === 'ADMIN';
    const rental = await (0, rental_query_1.findRentalByIdOrFail)(rentalId);
    const rentalItem = await (0, rental_item_query_1.findRentalItemByIdOrFail)(itemId);
    if (rentalItem.rentalId !== rental.id) {
        throw new Error('Rental item does not belong to the specified rental');
    }
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const interval = (0, helper_1.normalizeInterval)(startDate, endDate);
    const dates = (0, date_fns_1.eachDayOfInterval)(interval);
    return prisma_1.prisma.$transaction(async (tx) => {
        const reference = await (0, booking_query_1.createUniqueBookingReference)(tx);
        await (0, rental_inventory_service_1.ensureRentalInventory)(tx, { itemId: rentalItem.id, dates, quantity });
        await (0, rental_inventory_service_1.lockRentalInventory)(tx, { itemId: rentalItem.id, dates });
        const reserveResult = await (0, rental_inventory_service_1.reserveRentalInventory)(tx, {
            itemId: rentalItem.id,
            dates,
            isAdmin,
            userId,
            quantity,
        });
        const totalPrice = (0, rental_pricing_query_1.calculateRentalPrice)({
            rentalItem,
            pricingType,
            quantity,
            startDate: interval.start,
            endDate: interval.end,
        });
        const booking = await tx.booking.create({
            data: {
                reference,
                type: 'RENTAL',
                totalPrice,
                isAdminOverride: reserveResult.hasAdminOverride,
                userId,
                expiresAt,
                bookingStatus: isAdmin ? 'CONFIRMED' : 'PENDING',
                paymentStatus: isAdmin ? 'PAID' : 'PENDING',
                paidAmount: isAdmin ? totalPrice : 0,
                remainingBalance: isAdmin ? 0 : totalPrice,
            },
        });
        await tx.rentalBooking.create({
            data: {
                bookingId: booking.id,
                rentalItemId: rentalItem.id,
                startDate,
                endDate,
                pickupLocation,
                returnLocation,
                pricingType,
                hasOverbooking: reserveResult.hasOverbooking,
                quantity,
                notes,
            },
        });
        let paymentTransaction = null;
        if (!isAdmin) {
            paymentTransaction = await (0, payment_query_1.createInitialBookingPayment)(tx, {
                amount: totalPrice,
                bookingId: booking.id,
                type: 'INITIAL_PAYMENT',
            });
        }
        else {
            paymentTransaction = await (0, payment_query_1.createPaymentTransaction)({
                tx,
                type: 'MANUAL_ADJUSTMENT',
                amount: totalPrice,
                paymentStatus: 'PAID',
                bookingId: booking.id,
                description: 'Admin offline booking payment',
            });
        }
        await (0, booking_audit_service_1.logBookingAction)({
            tx,
            userId,
            role,
            newValue: booking,
            action: 'CREATED',
        });
        return {
            booking,
            payment: paymentTransaction
                ? {
                    paymentStatus: paymentTransaction.paymentStatus,
                    invoiceUrl: paymentTransaction.invoiceUrl,
                    amount: paymentTransaction.amount,
                }
                : null,
        };
    });
}
async function rescheduleRentalItemBookingService(bookingId, userId, role, { startDate, endDate }) {
    const isAdmin = role === 'ADMIN';
    const rentalBooking = await (0, rental_booking_query_1.findRentalItemBookingOrThrow)(bookingId);
    const booking = rentalBooking.booking;
    const item = rentalBooking.item;
    if (booking.bookingStatus !== 'CONFIRMED') {
        throw new Error('Only confirmed boooking can be rescheduled');
    }
    if (booking.rescheduleCount >= booking_rule_1.BOOKING_RULES.MAX_RESCHEDULES) {
        throw new Error('Maximum reschedule attempts exceeded');
    }
    const oldInterval = (0, helper_1.normalizeInterval)(rentalBooking.startDate, rentalBooking.endDate);
    const newInterval = (0, helper_1.normalizeInterval)(startDate, endDate);
    if (oldInterval === newInterval) {
        throw new Error('No changes detected');
    }
    const oldDates = (0, date_fns_1.eachDayOfInterval)(oldInterval);
    const newDates = (0, date_fns_1.eachDayOfInterval)(newInterval);
    const datesToReserve = newDates.filter((n) => !oldDates.some((o) => (0, date_fns_1.isSameDay)(o, n)));
    const datesToRelease = oldDates.filter((o) => !newDates.some((n) => (0, date_fns_1.isSameDay)(n, o)));
    const cutoff = new Date(rentalBooking.startDate.getTime() -
        booking_rule_1.BOOKING_RULES.CUTOFF_HOURS * 60 * 60 * 1000);
    if (new Date() > cutoff) {
        throw new Error(`Rescheduling must be done at least ${booking_rule_1.BOOKING_RULES.CUTOFF_HOURS} hours before the start time`);
    }
    if (rentalBooking.booking.rescheduleCount >= booking_rule_1.BOOKING_RULES.MAX_RESCHEDULES) {
        throw new Error(`Maximum reschedule reached.`);
    }
    return prisma_1.prisma.$transaction(async (tx) => {
        await (0, rental_inventory_service_1.lockRentalInventory)(tx, { itemId: item.id, dates: datesToRelease });
        await (0, rental_inventory_service_1.releaseRentalInventory)(tx, {
            itemId: item.id,
            dates: datesToRelease,
            quantity: item.quantity,
        });
        await (0, rental_inventory_service_1.ensureRentalInventory)(tx, {
            itemId: item.id,
            dates: datesToReserve,
            quantity: item.quantity,
        });
        await (0, rental_inventory_service_1.lockRentalInventory)(tx, { itemId: item.id, dates: datesToReserve });
        const reserveResult = await (0, rental_inventory_service_1.reserveRentalInventory)(tx, {
            itemId: item.id,
            dates: datesToReserve,
            isAdmin,
            userId,
            quantity: item.quantity,
        });
        const resched = await tx.booking.update({
            where: { id: bookingId },
            data: {
                type: 'RENTAL',
                lastRescheduleDate: new Date(),
                rescheduleCount: { increment: 1 },
                isAdminOverride: reserveResult.hasAdminOverride,
            },
        });
        await tx.rentalBooking.update({
            where: { bookingId },
            data: {
                startDate: newInterval.start,
                endDate: newInterval.end,
            },
        });
        await (0, booking_audit_service_1.logBookingAction)({
            tx,
            role,
            userId,
            newValue: resched,
            action: 'RESCHEDULED',
            previousValue: booking,
        });
        return resched;
    });
}
async function cancelRentalBooking({ bookingId, userId, role, }) {
    const rentalBooking = await (0, rental_booking_query_1.findRentalItemBookingOrThrow)(bookingId);
    const isAdmin = role === 'ADMIN';
    const booking = rentalBooking.booking;
    if (booking.bookingStatus !== 'CONFIRMED') {
        throw new Error('Only confirmed booking can be cancelled');
    }
    if (rentalBooking.startDate < new Date()) {
        throw new Error('Cannot cancel past bookings');
    }
    const interval = (0, helper_1.normalizeInterval)(rentalBooking.startDate, rentalBooking.endDate);
    const dates = (0, date_fns_1.eachDayOfInterval)(interval);
    const cutoff = new Date(rentalBooking.startDate.getTime() -
        booking_rule_1.BOOKING_RULES.CUTOFF_HOURS * 60 * 60 * 1000);
    if (new Date() >= cutoff) {
        throw new Error(`Cancellations must be made at least ${booking_rule_1.BOOKING_RULES.CUTOFF_HOURS} hours before the booking start time.`);
    }
    return prisma_1.prisma.$transaction(async (tx) => {
        await (0, rental_inventory_service_1.lockRentalInventory)(tx, { itemId: rentalBooking.item.id, dates });
        await (0, rental_inventory_service_1.releaseRentalInventory)(tx, {
            itemId: rentalBooking.item.id,
            dates,
            quantity: rentalBooking.quantity,
        });
        const cancelled = await tx.booking.update({
            where: { id: bookingId },
            data: {
                type: 'RENTAL',
                bookingStatus: 'CANCELLED',
                cancelledAt: new Date(),
                isAdminOverride: isAdmin,
            },
        });
        await (0, booking_audit_service_1.logBookingAction)({
            tx,
            userId,
            role,
            previousValue: booking,
            newValue: cancelled,
            action: 'CANCELLED',
        });
        return cancelled;
    });
}
