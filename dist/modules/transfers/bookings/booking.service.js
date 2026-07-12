"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTransferBookingService = createTransferBookingService;
exports.rescheduleTransferBooking = rescheduleTransferBooking;
exports.cancelTransferBooking = cancelTransferBooking;
const date_fns_1 = require("date-fns");
const prisma_1 = require("../../../config/prisma");
const booking_query_1 = require("../../bookings/booking.query");
const admin_warning_service_1 = require("../../logs/admin-warning.service");
const inventory_service_1 = require("../inventories/inventory.service");
const transfer_query_1 = require("../transfer.query");
const payment_query_1 = require("../../bookings/payment/payment.query");
const booking_audit_service_1 = require("../../bookings/audit/booking-audit.service");
const booking_query_2 = require("./booking.query");
const constant_1 = require("../../../constant/constant");
const schedule_query_1 = require("../schedules/schedule.query");
async function createTransferBookingService(transferId, userId, role, { passengers, pricingType, travelDate, dropoffLocation, pickupLocation, scheduleId, }) {
    const isAdmin = role === 'ADMIN';
    const transfer = await (0, transfer_query_1.findTransferOrThrow)(transferId);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const date = (0, date_fns_1.startOfDay)(travelDate);
    if (date < new Date()) {
        throw new Error('Invalid date selected');
    }
    let selectedSchedule = null;
    if (transfer.hasSchedule) {
        if (!scheduleId) {
            throw new Error('Schedule is required for this transfer.');
        }
        selectedSchedule = transfer.schedules.find((schedule) => schedule.id === scheduleId);
        if (!selectedSchedule) {
            throw new Error('Transfer schedule not found');
        }
    }
    if (!transfer.hasSchedule && scheduleId) {
        throw new Error('Exclusive transfer does not have schedule');
    }
    const selectedPricing = transfer.pricing.find((pricing) => pricing.pricingType === pricingType);
    if (!selectedPricing) {
        throw new Error('Transfer pricing not found');
    }
    if (passengers > selectedPricing.maxPassengers) {
        throw new Error('Cannot exceed the maximum passenger');
    }
    const maxPassengers = selectedSchedule
        ? selectedSchedule.maxPassengers
        : passengers;
    return prisma_1.prisma.$transaction(async (tx) => {
        const reference = await (0, booking_query_1.createUniqueBookingReference)(tx);
        if (maxPassengers && passengers > maxPassengers) {
            if (!isAdmin) {
                throw new Error('Passenger limit exceeds');
            }
            await (0, admin_warning_service_1.logAdminWarning)({
                tx,
                actionType: 'EXCEED_CAPACITY',
                message: `Admin exceeds maximum passenger seat`,
                actorId: userId,
                transferId: transfer.id,
                metadata: {
                    passengers,
                    maxPassengers,
                },
            });
        }
        let totalPrice = 0;
        if (pricingType === 'JOINER') {
            totalPrice = Number(selectedPricing.price) * passengers;
        }
        else {
            totalPrice = Number(selectedPricing.price);
        }
        await (0, inventory_service_1.ensureTransferInventory)(tx, {
            transferId: transfer.id,
            travelDate,
            maxPassengers,
            scheduleId,
        });
        await (0, inventory_service_1.lockTransferInventory)(tx, {
            transferId: transfer.id,
            travelDate,
        });
        const reservationResult = await (0, inventory_service_1.reserveTransferInventory)(tx, {
            transferId,
            travelDate,
            isAdmin,
            passengers,
            pricingType,
            userId,
            scheduleId,
        });
        //create booking
        const booking = await tx.booking.create({
            data: {
                reference,
                type: 'TRANSFER',
                totalPrice,
                isAdminOverride: reservationResult.hasAdminOverride,
                userId,
                expiresAt,
                bookingStatus: isAdmin ? 'CONFIRMED' : 'PENDING',
                paymentStatus: isAdmin ? 'PAID' : 'PENDING',
                paidAmount: isAdmin ? totalPrice : 0,
                remainingBalance: isAdmin ? 0 : totalPrice,
            },
        });
        //domain booking
        await tx.transferBooking.create({
            data: {
                bookingId: booking.id,
                transferId: transfer.id,
                date,
                passengers,
                pricingType,
                pickupLocation,
                dropoffLocation,
                scheduleId: scheduleId ?? null,
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
async function rescheduleTransferBooking(bookingId, userId, role, { travelDate, scheduleId }) {
    const isAdmin = role === 'ADMIN';
    const transferBooking = await (0, booking_query_2.findTransferBookingOrThrow)({
        bookingId,
    });
    const booking = transferBooking.booking;
    if (booking.bookingStatus !== 'CONFIRMED') {
        throw new Error('Only confirmed bookings can be rescheduled');
    }
    if (booking.rescheduleCount >= constant_1.BOOKING_RULES.MAX_RESCHEDULES) {
        throw new Error('Maximum reschedule attempts exceeded');
    }
    const oldScheduleId = transferBooking.scheduleId ?? null;
    const oldTravelDate = (0, date_fns_1.startOfDay)(transferBooking.date);
    const newTravelDate = (0, date_fns_1.startOfDay)(travelDate);
    const isSameDate = oldTravelDate.getTime() === newTravelDate.getTime();
    if (newTravelDate < new Date()) {
        throw new Error('Invalid date selected');
    }
    let selectedSchedule = null;
    if (!oldScheduleId) {
        if (scheduleId) {
            throw new Error('Schedule is not required');
        }
        if (isSameDate) {
            throw new Error('Please select a different travel date');
        }
    }
    else {
        if (!scheduleId) {
            throw new Error('Please select a schedule');
        }
        const isSameSchedule = oldScheduleId === scheduleId;
        if (isSameSchedule && isSameDate) {
            throw new Error('Please select a different travel date or schedule');
        }
        selectedSchedule = await (0, schedule_query_1.validateTransferSchedule)(transferBooking.transferId, scheduleId);
    }
    return prisma_1.prisma.$transaction(async (tx) => {
        await (0, inventory_service_1.lockTransferInventory)(tx, {
            transferId: transferBooking.transferId,
            travelDate: oldTravelDate,
            scheduleId: oldScheduleId,
        });
        await (0, inventory_service_1.releaseTransferInventory)(tx, {
            transferId: transferBooking.transferId,
            scheduleId: oldScheduleId,
            travelDate: oldTravelDate,
            passengers: transferBooking.passengers,
            pricingType: transferBooking.pricingType,
        });
        await (0, inventory_service_1.ensureTransferInventory)(tx, {
            transferId: transferBooking.transferId,
            travelDate: newTravelDate,
            maxPassengers: selectedSchedule?.maxPassengers ?? transferBooking.passengers,
            scheduleId: selectedSchedule?.scheduleId,
        });
        await (0, inventory_service_1.lockTransferInventory)(tx, {
            scheduleId: selectedSchedule?.scheduleId,
            travelDate: newTravelDate,
            transferId: transferBooking.transferId,
        });
        const reservationResult = await (0, inventory_service_1.reserveTransferInventory)(tx, {
            userId,
            isAdmin,
            scheduleId: selectedSchedule?.scheduleId,
            travelDate: newTravelDate,
            passengers: transferBooking.passengers,
            transferId: transferBooking.transferId,
            pricingType: transferBooking.pricingType,
        });
        const resched = await tx.booking.update({
            where: { id: bookingId },
            data: {
                type: 'TRANSFER',
                lastRescheduleDate: new Date(),
                rescheduleCount: { increment: 1 },
                isAdminOverride: reservationResult.hasAdminOverride,
            },
        });
        await tx.transferBooking.update({
            where: { bookingId },
            data: {
                date: newTravelDate,
                scheduleId: selectedSchedule?.scheduleId,
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
async function cancelTransferBooking({ bookingId, userId, role, }) {
    const transferBooking = await (0, booking_query_2.findTransferBookingOrThrow)({
        bookingId,
    });
    const isAdmin = role === 'ADMIN';
    const booking = transferBooking.booking;
    if (booking.bookingStatus !== 'CONFIRMED') {
        throw new Error('Only confirmed bookings can be cancelled');
    }
    if (transferBooking.date < new Date()) {
        throw new Error('Cannot cancel past bookings');
    }
    const cutoff = new Date(transferBooking.date.getTime() -
        constant_1.BOOKING_RULES.RESCHEDULE_CUTOFF_HOURS * 60 * 60 * 1000);
    if (new Date() >= cutoff) {
        throw new Error(`Cancellations must be made at least ${constant_1.BOOKING_RULES.RESCHEDULE_CUTOFF_HOURS} hours before the booking start time.`);
    }
    return prisma_1.prisma.$transaction(async (tx) => {
        //cancellation policy for transfer can be implemented here if needed in the future
        await (0, inventory_service_1.lockTransferInventory)(tx, {
            transferId: transferBooking.transferId,
            travelDate: transferBooking.date,
            scheduleId: transferBooking.scheduleId,
        });
        await (0, inventory_service_1.releaseTransferInventory)(tx, {
            transferId: transferBooking.transferId,
            scheduleId: transferBooking.scheduleId,
            travelDate: transferBooking.date,
            passengers: transferBooking.passengers,
            pricingType: transferBooking.pricingType,
        });
        const cancelledBooking = await tx.booking.update({
            where: { id: bookingId },
            data: {
                type: 'TRANSFER',
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
            newValue: cancelledBooking,
            action: 'CANCELLED',
        });
        return cancelledBooking;
    });
}
