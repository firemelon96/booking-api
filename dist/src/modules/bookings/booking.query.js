"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectOverbooking = detectOverbooking;
exports.findBookingOrThrow = findBookingOrThrow;
exports.findBookingById = findBookingById;
exports.findTourBookingOrThrow = findTourBookingOrThrow;
exports.calculateCancellationRefund = calculateCancellationRefund;
exports.createUniqueBookingReference = createUniqueBookingReference;
const prisma_1 = require("../../config/prisma");
const booking_reference_1 = require("./booking.reference");
function detectOverbooking({ capacity, booked, participants, }) {
    return booked + participants > capacity;
}
async function findBookingOrThrow({ bookingId, role, userId, }) {
    const booking = await prisma_1.prisma.booking.findFirst({
        where: {
            id: bookingId,
            ...(role === 'USER' ? { userId } : {}),
        },
        include: {
            tourBooking: {
                select: {
                    tour: true,
                    startDate: true,
                    endDate: true,
                    notes: true,
                    participants: true,
                    pricingType: true,
                    schedule: true,
                },
            },
            accommodationBooking: {
                select: {
                    accommodation: {
                        select: { hasUnits: true, name: true },
                    },
                    unit: true,
                    checkIn: true,
                    checkOut: true,
                    guests: true,
                    nights: true,
                    specialRequests: true,
                },
            },
            transferBooking: {
                select: {
                    transfer: true,
                    date: true,
                    passengers: true,
                    pickupLocation: true,
                    dropoffLocation: true,
                    pricingType: true,
                    schedule: true,
                },
            },
            rentalBooking: {
                select: {
                    item: true,
                    startDate: true,
                    endDate: true,
                    pickupLocation: true,
                    returnLocation: true,
                    notes: true,
                    quantity: true,
                },
            },
        },
    });
    if (!booking) {
        throw new Error('Booking Not found');
    }
    return booking;
}
async function findBookingById(bookingId) {
    const booking = await prisma_1.prisma.booking.findFirst({
        where: {
            id: bookingId,
        },
    });
    if (!booking) {
        throw new Error('Booking Not found');
    }
    return booking;
}
async function findTourBookingOrThrow({ bookingId, userId, role, }) {
    const tourBooking = await prisma_1.prisma.tourBooking.findUnique({
        where: { bookingId, ...(role === 'USER' ? { userId } : {}) },
        include: { booking: true, tour: true },
    });
    if (!tourBooking) {
        throw new Error('Cannot find tour');
    }
    return tourBooking;
}
function calculateCancellationRefund({ bookingDate, startDate, totalPrice, policy, }) {
    const now = bookingDate;
    const diffMs = startDate.getTime() - now.getTime();
    const hoursBeforeTour = diffMs / (1000 * 60 * 60);
    if (!policy) {
        return {
            refundAmount: totalPrice,
            refundPercentage: 100,
            refundType: 'FULL',
        };
    }
    if (hoursBeforeTour >= policy.fullRefundHours) {
        return {
            refundType: 'FULL',
            refundAmount: totalPrice,
            refundPercentage: 100,
        };
    }
    if (hoursBeforeTour >= policy.partialRefundHours) {
        const amount = totalPrice * (policy.partialRefundPercentage / 100);
        return {
            refundType: 'PARTIAL',
            refundAmount: amount,
            refundPercentage: policy.partialRefundPercentage,
        };
    }
    return {
        refundType: 'NONE',
        refundAmount: 0,
        refundPercentage: 0,
    };
}
async function createUniqueBookingReference(tx) {
    while (true) {
        const reference = (0, booking_reference_1.generateBookingReference)();
        const existing = await tx.booking.findUnique({
            where: {
                reference,
            },
        });
        if (!existing) {
            return reference;
        }
    }
}
