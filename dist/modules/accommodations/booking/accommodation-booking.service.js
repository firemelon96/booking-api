"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAccommodationBookingService = createAccommodationBookingService;
exports.reschedAccommodationBooking = reschedAccommodationBooking;
exports.cancelAccommodationBookingService = cancelAccommodationBookingService;
const prisma_1 = require("../../../config/prisma");
const booking_audit_service_1 = require("../../bookings/audit/booking-audit.service");
const booking_query_1 = require("../../bookings/booking.query");
const booking_rule_1 = require("../../bookings/booking.rule");
const payment_query_1 = require("../../bookings/payment/payment.query");
const admin_warning_service_1 = require("../../logs/admin-warning.service");
const accommodation_query_1 = require("../accommodation.query");
const inventory_lock_service_1 = require("../inventory/inventory-lock.service");
const inventory_release_service_1 = require("../inventory/inventory-release.service");
const inventory_service_1 = require("../inventory/inventory.service");
const accommodation_booking_utils_1 = require("./accommodation-booking.utils");
const accommodation_query_2 = require("./accommodation.query");
async function createAccommodationBookingService(accommodationId, userId, role, data) {
    const { checkIn, checkOut, units, adults, specialRequests, unitId, children, } = data;
    const isAdmin = role === 'ADMIN';
    const accommodation = await (0, accommodation_query_1.findAccommodationOrFail)(accommodationId);
    if (accommodation.hasUnits && !unitId) {
        throw new Error('Unit is required');
    }
    if (!accommodation.hasUnits && unitId) {
        throw new Error('This accommodation does not have units');
    }
    const dates = (0, accommodation_booking_utils_1.getStayDates)({ checkIn, checkOut });
    const nights = (0, accommodation_booking_utils_1.getNightCount)({ checkIn, checkOut });
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const guests = children ? adults + children : adults;
    return prisma_1.prisma.$transaction(async (tx) => {
        const reference = await (0, booking_query_1.createUniqueBookingReference)(tx);
        let title;
        let selectedUnit;
        let reservationResult = {
            hasOverbooking: false,
            adminOverride: false,
        };
        if (unitId) {
            selectedUnit = await tx.accommodationUnit.findFirst({
                where: {
                    id: unitId,
                    accommodationId,
                },
            });
            title = selectedUnit?.name;
            if (!selectedUnit) {
                throw new Error('Unit not found');
            }
            const maxUnitGuest = selectedUnit.maxAdult + (selectedUnit.maxChildren ?? 0);
            if (guests > maxUnitGuest) {
                if (!isAdmin) {
                    throw new Error('Guest count exceeds unit limit');
                }
                reservationResult.adminOverride = true;
                await (0, admin_warning_service_1.logAdminWarning)({
                    tx,
                    actionType: 'EXCEED_CAPACITY',
                    message: `Admin exceeds maxguest limit on ${dates}`,
                    actorId: userId,
                    unitId: selectedUnit.id,
                    metadata: selectedUnit,
                });
            }
            await (0, inventory_service_1.ensureUnitInventoryRows)(tx, {
                unitId,
                quantity: selectedUnit.quantity,
                dates,
            });
            await (0, inventory_lock_service_1.lockUnitInventory)(tx, {
                unitId,
                dates,
            });
            reservationResult = await (0, inventory_service_1.reserveUnitInventory)(tx, {
                unitId,
                dates,
                units,
                isAdmin,
                userId,
            });
        }
        else {
            if (guests > (accommodation.maxGuests ?? 0)) {
                if (!isAdmin) {
                    throw new Error('Guest count exceeds accommodation limit');
                }
                title = accommodation.name;
                reservationResult.adminOverride = true;
                await (0, admin_warning_service_1.logAdminWarning)({
                    tx,
                    actionType: 'EXCEED_CAPACITY',
                    actorId: userId,
                    accommodationId: accommodation.id,
                    message: `Admin exceeding limit accommodation on ${dates}`,
                    metadata: accommodation,
                });
            }
            await (0, inventory_service_1.ensureAccommodationInventoryRows)(tx, { accommodationId, dates });
            await (0, inventory_lock_service_1.lockAccommodationInventory)(tx, { accommodationId, dates });
            reservationResult = await (0, inventory_service_1.reserveAccommodationInventory)(tx, {
                accommodationId,
                dates,
                units,
                userId,
                isAdmin,
            });
        }
        const totalPrice = await (0, inventory_service_1.calculateAccommodationPricing)(tx, {
            accommodation,
            unit: selectedUnit,
            dates,
            units,
        });
        const booking = await tx.booking.create({
            data: {
                reference,
                type: 'ACCOMMODATION',
                userId,
                totalPrice,
                expiresAt,
                isAdminOverride: reservationResult.adminOverride,
                bookingStatus: isAdmin ? 'CONFIRMED' : 'PENDING',
                paymentStatus: isAdmin ? 'PAID' : 'PENDING',
                paidAmount: isAdmin ? totalPrice : 0,
                remainingBalance: isAdmin ? 0 : totalPrice,
            },
        });
        await tx.accommodationBooking.create({
            data: {
                bookingId: booking.id,
                accommodationId: accommodation.id,
                unitId: selectedUnit?.id ?? null,
                checkIn,
                checkOut,
                nights,
                guests,
                units,
                specialRequests,
                isOverbooked: reservationResult.hasOverbooking,
            },
        });
        let paymentTransaction = null;
        if (!isAdmin) {
            paymentTransaction = await (0, payment_query_1.createInitialBookingPayment)(tx, {
                amount: totalPrice,
                bookingId: booking.id,
                type: 'INITIAL_PAYMENT',
                description: title,
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
async function reschedAccommodationBooking(bookingId, userId, role, payload) {
    const isAdmin = role === 'ADMIN';
    const { checkIn, checkOut } = payload;
    const accommodationBooking = await (0, accommodation_query_2.findAccommodationBookingOrThrow)({
        bookingId,
        role,
        userId,
    });
    const booking = accommodationBooking.booking;
    const accommodationId = accommodationBooking.accommodationId;
    const unitId = accommodationBooking.unitId;
    if (booking.bookingStatus === 'CANCELLED' ||
        booking.bookingStatus === 'EXPIRED') {
        throw new Error('Cannot reschedule this booking');
    }
    if (booking.rescheduleCount > booking_rule_1.BOOKING_RULES.MAX_RESCHEDULES) {
        throw new Error(`Cannot rechedule more than ${booking_rule_1.BOOKING_RULES.MAX_RESCHEDULES}`);
    }
    const oldDates = (0, accommodation_booking_utils_1.getStayDates)({
        checkIn: accommodationBooking.checkIn,
        checkOut: accommodationBooking.checkOut,
    });
    const newDates = (0, accommodation_booking_utils_1.getStayDates)({ checkIn, checkOut });
    return prisma_1.prisma.$transaction(async (tx) => {
        if (unitId) {
            await (0, inventory_lock_service_1.lockUnitInventory)(tx, {
                unitId,
                dates: oldDates,
            });
            await (0, inventory_release_service_1.releaseUnitInventory)(tx, {
                unitId,
                dates: oldDates,
                units: accommodationBooking.units,
            });
            await (0, inventory_service_1.ensureUnitInventoryRows)(tx, {
                unitId,
                dates: newDates,
                quantity: accommodationBooking.unit?.quantity ?? 1,
            });
            await (0, inventory_lock_service_1.lockUnitInventory)(tx, {
                unitId,
                dates: newDates,
            });
            await (0, inventory_service_1.reserveUnitInventory)(tx, {
                unitId,
                dates: newDates,
                units: accommodationBooking.units,
                isAdmin,
                userId,
            });
        }
        else {
            await (0, inventory_lock_service_1.lockAccommodationInventory)(tx, {
                accommodationId,
                dates: oldDates,
            });
            await (0, inventory_release_service_1.releaseAccommodationInventory)(tx, {
                accommodationId,
                dates: oldDates,
                units: accommodationBooking.units,
            });
            await (0, inventory_service_1.ensureAccommodationInventoryRows)(tx, {
                accommodationId,
                dates: newDates,
            });
            await (0, inventory_lock_service_1.lockAccommodationInventory)(tx, {
                accommodationId,
                dates: newDates,
            });
            await (0, inventory_service_1.reserveAccommodationInventory)(tx, {
                accommodationId,
                dates: newDates,
                isAdmin,
                userId,
                units: accommodationBooking.units,
            });
        }
        const newTotalPrice = await (0, inventory_service_1.calculateAccommodationPricing)(tx, {
            accommodation: accommodationBooking.accommodation,
            unit: accommodationBooking.unit,
            dates: newDates,
            units: accommodationBooking.units,
        });
        const oldPrice = Number(booking.totalPrice);
        const priceDifference = newTotalPrice - oldPrice;
        if (priceDifference < 0) {
            throw new Error('Automatic refund on reschedule is not yet upported');
        }
        let bookingStatus = booking.bookingStatus;
        if (priceDifference > 0) {
            bookingStatus = 'PENDING';
        }
        const updateBooking = await tx.booking.update({
            where: {
                id: bookingId,
            },
            data: {
                type: 'ACCOMMODATION',
                rescheduleCount: { increment: 1 },
                lastRescheduleDate: new Date(),
                isAdminOverride: role === 'ADMIN',
                remainingBalance: Number(booking.remainingBalance) + priceDifference,
                totalPrice: newTotalPrice,
                bookingStatus,
            },
        });
        await tx.accommodationBooking.update({
            where: { bookingId },
            data: {
                checkIn,
                checkOut,
                nights: (0, accommodation_booking_utils_1.getNightCount)({ checkIn, checkOut }),
            },
        });
        let paymentTransaction = null;
        if (priceDifference > 0) {
            paymentTransaction = await (0, payment_query_1.createRescheduleAdjustmentPayment)({
                tx,
                amount: priceDifference,
                bookingId,
                customer: {
                    givenName: booking.user ?? 'Guest',
                    email: booking.user.email,
                },
            });
        }
        await (0, booking_audit_service_1.logBookingAction)({
            tx,
            userId,
            role,
            previousValue: accommodationBooking,
            newValue: updateBooking,
            action: 'RESCHEDULED',
        });
        return {
            booking: updateBooking,
            pricing: {
                oldPrice,
                newTotalPrice,
                priceDifference,
                requireAdditionalPayment: priceDifference > 0,
            },
            payment: paymentTransaction
                ? {
                    amount: priceDifference,
                    invoiceUrl: paymentTransaction.invoiceUrl,
                    paymentStatus: paymentTransaction.paymentStatus,
                }
                : null,
        };
    });
}
async function cancelAccommodationBookingService({ bookingId, userId, role, }) {
    const accommodationBooking = await (0, accommodation_query_2.findAccommodationBookingOrThrow)({
        bookingId,
        userId,
        role,
    });
    const booking = accommodationBooking.booking;
    const unitId = accommodationBooking.unitId;
    const accommodationId = accommodationBooking.accommodationId;
    if (booking.bookingStatus === 'CANCELLED' ||
        booking.bookingStatus === 'EXPIRED') {
        throw new Error('Cannot reschedule this booking');
    }
    const dates = (0, accommodation_booking_utils_1.getStayDates)({
        checkIn: accommodationBooking.checkIn,
        checkOut: accommodationBooking.checkOut,
    });
    return prisma_1.prisma.$transaction(async (tx) => {
        //fix this policy later
        // const policy = await tx.accommodationCancellationPolicy.findUnique({
        //   where: { accommodationId: accommodationBooking.accommodationId },
        // });
        // let refund = {
        //   refundAmount: 0,
        //   refundPercentage: 0,
        //   refundType: CancellationRefundType.NONE,
        // };
        // if (policy) {
        //   refund = calculateCancellationRefund({
        //     bookingDate: accommodationBooking.createdAt,
        //     startDate: accommodationBooking.checkIn,
        //     totalPrice: Number(accommodationBooking.booking.totalPrice),
        //     policy,
        //   });
        // }
        if (unitId) {
            (0, inventory_release_service_1.releaseUnitInventory)(tx, {
                unitId,
                dates,
                units: accommodationBooking.units,
            });
        }
        else {
            (0, inventory_release_service_1.releaseAccommodationInventory)(tx, {
                accommodationId,
                dates,
                units: accommodationBooking.units,
            });
        }
        const cancelled = await tx.booking.update({
            where: { id: bookingId },
            data: {
                type: 'ACCOMMODATION',
                bookingStatus: 'CANCELLED',
                refundStatus: 'PENDING',
                cancelledAt: new Date(),
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
