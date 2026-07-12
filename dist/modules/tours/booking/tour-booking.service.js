"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTourBooking = createTourBooking;
exports.rescheduleTourBooking = rescheduleTourBooking;
exports.cancelTourbooking = cancelTourbooking;
const date_fns_1 = require("date-fns");
const helper_1 = require("../../../utils/helper");
const booking_rule_1 = require("../../bookings/booking.rule");
const tour_query_1 = require("../tour.query");
const prisma_1 = require("../../../config/prisma");
const booking_query_1 = require("../../bookings/booking.query");
const availability_query_1 = require("../availability/availability.query");
const capacity_query_1 = require("../capacity/capacity.query");
const pricing_query_1 = require("../pricing/pricing.query");
const booking_audit_service_1 = require("../../bookings/audit/booking-audit.service");
const payment_query_1 = require("../../bookings/payment/payment.query");
async function createTourBooking(tourId, userId, role, { startDate, endDate, participants, pricingType, notes, scheduleId, }) {
    const isAdmin = role === 'ADMIN';
    const tour = await (0, tour_query_1.findTourOrFail)(tourId);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
    const interval = (0, helper_1.normalizeInterval)(startDate, endDate);
    const dates = (0, date_fns_1.eachDayOfInterval)(interval);
    (0, booking_rule_1.validateBookingRules)({
        scheduleId: scheduleId ?? null,
        participants,
        durationDays: tour.durationDays ?? undefined,
        schedules: tour.schedules,
        interval,
    });
    const capacity = pricingType === 'PRIVATE' ? participants : tour.joinerCapacity;
    return prisma_1.prisma.$transaction(async (tx) => {
        const reference = await (0, booking_query_1.createUniqueBookingReference)(tx);
        await (0, availability_query_1.checkAvailability)({ tx, tourId, dates, role, userId });
        await (0, capacity_query_1.prepareCapacity)({
            tx,
            tourId,
            scheduleId,
            capacity,
            dates,
        });
        const rows = await (0, capacity_query_1.lockCapacityRows)(tx, {
            tourId,
            dates,
            scheduleId,
        });
        const { hasAdminOverride, hasOverbooking } = await (0, capacity_query_1.reserveCapacity)({
            tx,
            rows,
            capacityMode: tour.capacityMode,
            participants,
            pricingType,
            isAdmin,
            userId,
        });
        const { totalPrice } = await (0, pricing_query_1.calculate)({
            tx,
            tourId,
            pricingType,
            participants,
        });
        const booking = await tx.booking.create({
            data: {
                reference,
                type: 'TOUR',
                userId,
                totalPrice,
                isAdminOverride: hasAdminOverride,
                expiresAt,
                bookingStatus: isAdmin ? 'CONFIRMED' : 'PENDING',
                paymentStatus: isAdmin ? 'PAID' : 'PENDING',
                paidAmount: isAdmin ? totalPrice : 0,
                remainingBalance: isAdmin ? 0 : totalPrice,
            },
        });
        await tx.tourBooking.create({
            data: {
                bookingId: booking.id,
                tourId,
                pricingType,
                participants,
                startDate,
                endDate,
                notes,
                scheduleId,
                isOverbooked: hasOverbooking,
            },
        });
        let paymentTransaction = null;
        if (role !== 'ADMIN') {
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
async function rescheduleTourBooking(bookingId, userId, role, { newEndDate, newStartDate, scheduleId }) {
    const isAdmin = role === 'ADMIN';
    const tourBooking = await (0, booking_query_1.findTourBookingOrThrow)({
        bookingId,
        role,
        userId,
    });
    const newInterval = (0, helper_1.normalizeInterval)(newStartDate, newEndDate);
    const { datesToRelease, datesToReserve, oldScheduleId } = (0, booking_rule_1.validateRescheduleRules)(tourBooking, newInterval);
    return prisma_1.prisma.$transaction(async (tx) => {
        await (0, availability_query_1.checkAvailability)({
            tx,
            tourId: tourBooking.tourId,
            dates: datesToReserve,
            role,
            userId,
        });
        await (0, capacity_query_1.lockCapacityRows)(tx, {
            tourId: tourBooking.tourId,
            dates: datesToRelease,
            scheduleId: oldScheduleId,
        });
        await (0, capacity_query_1.releaseCapacity)({
            tx,
            dates: datesToRelease,
            participants: tourBooking.participants,
            scheduleId: oldScheduleId,
            tourId: tourBooking.tourId,
        });
        await (0, capacity_query_1.prepareCapacity)({
            tx,
            scheduleId,
            dates: datesToReserve,
            tourId: tourBooking.tourId,
            capacity: tourBooking.participants,
        });
        const rows = await (0, capacity_query_1.lockCapacityRows)(tx, {
            scheduleId,
            dates: datesToReserve,
            tourId: tourBooking.tourId,
        });
        const { hasAdminOverride, hasOverbooking } = await (0, capacity_query_1.reserveCapacity)({
            tx,
            userId,
            isAdmin,
            rows,
            pricingType: tourBooking.pricingType,
            participants: tourBooking.participants,
            capacityMode: tourBooking.tour.capacityMode,
        });
        const resched = await tx.booking.update({
            where: { id: bookingId },
            data: {
                type: 'TOUR',
                rescheduleCount: { increment: 1 },
                lastRescheduleDate: new Date(),
                isAdminOverride: hasAdminOverride,
            },
        });
        await tx.tourBooking.update({
            where: { bookingId },
            data: {
                startDate: newInterval.start,
                endDate: newInterval.end,
                isOverbooked: hasOverbooking,
                scheduleId,
            },
        });
        await (0, booking_audit_service_1.logBookingAction)({
            tx,
            userId,
            role,
            previousValue: tourBooking,
            newValue: resched,
            action: 'RESCHEDULED',
        });
        return resched;
    });
}
async function cancelTourbooking({ bookingId, userId, role, }) {
    const tourBooking = await (0, booking_query_1.findTourBookingOrThrow)({
        bookingId,
        userId,
        role,
    });
    (0, booking_rule_1.validateCancelRules)({
        existingBooking: tourBooking.booking,
        tourBooking,
    });
    const interval = (0, helper_1.normalizeInterval)(tourBooking.startDate, tourBooking.endDate);
    const dates = (0, date_fns_1.eachDayOfInterval)(interval);
    return prisma_1.prisma.$transaction(async (tx) => {
        const policy = await tx.cancellationPolicy.findUnique({
            where: { tourId: tourBooking.tourId },
        });
        const { refundAmount, refundPercentage, refundType } = (0, booking_query_1.calculateCancellationRefund)({
            bookingDate: tourBooking.createdAt,
            startDate: interval.start,
            totalPrice: Number(tourBooking.booking.totalPrice),
            policy,
        });
        await (0, capacity_query_1.releaseCapacity)({
            tx,
            dates,
            participants: tourBooking.participants,
            tourId: tourBooking.tourId,
            scheduleId: tourBooking.scheduleId,
        });
        const cancelled = await tx.booking.update({
            where: { id: bookingId },
            data: {
                type: 'TOUR',
                bookingStatus: 'CANCELLED',
                refundAmount,
                refundStatus: 'PENDING',
                cancelledAt: new Date(),
                cancellationRefundType: refundType,
                cancellationRefundPercentage: refundPercentage,
                isAdminOverride: role === 'ADMIN',
            },
        });
        await (0, booking_audit_service_1.logBookingAction)({
            tx,
            userId,
            role,
            newValue: cancelled,
            action: 'CANCELLED',
        });
        return cancelled;
    });
}
