"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllBookingsService = getAllBookingsService;
exports.getBookingByReference = getBookingByReference;
exports.rescheduleBooking = rescheduleBooking;
exports.cancelbooked = cancelbooked;
exports.detailedBooking = detailedBooking;
exports.expiredBooking = expiredBooking;
const date_fns_1 = require("date-fns");
const prisma_1 = require("../../config/prisma");
const helper_1 = require("../../utils/helper");
const capacity_query_1 = require("../tours/capacity/capacity.query");
const booking_audit_service_1 = require("./audit/booking-audit.service");
const booking_query_1 = require("./booking.query");
const booking_response_mapped_1 = require("./booking-response.mapped");
const accommodation_booking_service_1 = require("../accommodations/booking/accommodation-booking.service");
const tour_booking_service_1 = require("../tours/booking/tour-booking.service");
const booking_service_1 = require("../transfers/bookings/booking.service");
const rental_booking_service_1 = require("../rentals/bookings/rental-booking.service");
async function getAllBookingsService(userId, role, { page = 1, limit = 10, search, sort = 'createdAt:desc', bookingStatus, paymentStatus, reference, type, }) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(50, limit);
    const skip = (safePage - 1) * safeLimit;
    const [sortField, sortOrder] = sort.split(':');
    const orderBy = {
        [sortField || 'createdAt']: sortOrder === 'asc' ? 'asc' : 'desc',
    };
    const where = {
        ...(role === 'USER' && { userId }),
        ...(bookingStatus && { bookingStatus }),
        ...(paymentStatus && { paymentStatus }),
        ...(reference && { reference }),
        ...(type && { type }),
        ...(search && {
            OR: [
                {
                    tourBooking: {
                        tour: {
                            name: {
                                contains: search,
                                mode: 'insensitive',
                            },
                        },
                    },
                },
                {
                    accommodationBooking: {
                        accommodation: {
                            name: {
                                contains: search,
                                mode: 'insensitive',
                            },
                        },
                    },
                },
                {
                    accommodationBooking: {
                        unit: {
                            name: {
                                contains: search,
                                mode: 'insensitive',
                            },
                        },
                    },
                },
                {
                    transferBooking: {
                        transfer: {
                            name: {
                                contains: search,
                                mode: 'insensitive',
                            },
                        },
                    },
                },
                {
                    rentalBooking: {
                        item: {
                            name: {
                                contains: search,
                                mode: 'insensitive',
                            },
                        },
                    },
                },
            ],
        }),
    };
    const [data, total] = await prisma_1.prisma.$transaction([
        prisma_1.prisma.booking.findMany({
            where,
            skip,
            take: safeLimit,
            orderBy,
            include: {
                user: true,
                tourBooking: {
                    select: { tour: true, startDate: true, endDate: true },
                },
                accommodationBooking: {
                    select: {
                        accommodation: true,
                        unit: true,
                        checkIn: true,
                        checkOut: true,
                    },
                },
                transferBooking: {
                    select: {
                        transfer: true,
                        date: true,
                    },
                },
                rentalBooking: {
                    select: {
                        item: true,
                        startDate: true,
                        endDate: true,
                    },
                },
            },
        }),
        prisma_1.prisma.booking.count({ where }),
    ]);
    return {
        data: data.map((b) => ({
            id: b.id,
            user: b.user.email,
            reference: b.reference,
            type: b.type,
            bookingStatus: b.bookingStatus,
            paymentStatus: b.paymentStatus,
            totalPrice: b.totalPrice,
            tourName: b.tourBooking?.tour.name,
            tourStart: b.tourBooking?.startDate,
            tourEnd: b.tourBooking?.endDate,
            accommodationName: b.accommodationBooking?.accommodation.name,
            accommodationUnitName: b.accommodationBooking?.unit?.name,
            checkIn: b.accommodationBooking?.checkIn,
            checkOut: b.accommodationBooking?.checkOut,
            rentalItemName: b.rentalBooking?.item.name,
            rentalStart: b.rentalBooking?.startDate,
            rentalEnd: b.rentalBooking?.endDate,
            transferName: b.transferBooking?.transfer.name,
            travelDate: b.transferBooking?.date,
        })),
        meta: {
            total,
            page: safePage,
            pageSize: safeLimit,
            pageCount: Math.ceil(total / safeLimit),
        },
    };
}
async function getBookingByReference(reference) {
    const booking = await prisma_1.prisma.booking.findUnique({
        where: {
            reference,
        },
        include: {
            tourBooking: { select: { tour: true } },
            accommodationBooking: {
                select: {
                    accommodation: true,
                    unit: true,
                },
            },
        },
    });
    if (!booking) {
        throw new Error('No booking record');
    }
    switch (booking.type) {
        case 'TOUR':
            return (0, booking_response_mapped_1.mapTourBooking)(booking);
        case 'ACCOMMODATION':
            return (0, booking_response_mapped_1.mapAccommodationBooking)(booking);
        default:
            throw new Error('Booking does not exist');
    }
}
async function rescheduleBooking(bookingId, userId, role, payload) {
    const booking = await (0, booking_query_1.findBookingOrThrow)({ bookingId, role, userId });
    switch (booking.type) {
        case 'ACCOMMODATION':
            return (0, accommodation_booking_service_1.reschedAccommodationBooking)(bookingId, userId, role, {
                checkIn: payload.checkIn,
                checkOut: payload.checkOut,
            });
        case 'TOUR':
            return (0, tour_booking_service_1.rescheduleTourBooking)(bookingId, userId, role, {
                newEndDate: payload.endDate,
                newStartDate: payload.startDate,
                scheduleId: payload.scheduleId,
            });
        case 'TRANSFER':
            return (0, booking_service_1.rescheduleTransferBooking)(bookingId, userId, role, {
                travelDate: payload.travelDate,
                scheduleId: payload.scheduleId,
            });
        case 'RENTAL':
            return (0, rental_booking_service_1.rescheduleRentalItemBookingService)(bookingId, userId, role, {
                startDate: payload.startDate,
                endDate: payload.endDate,
            });
        default:
            throw new Error('Invalid booking type');
    }
}
async function cancelbooked({ bookingId, userId, role, }) {
    const booking = await (0, booking_query_1.findBookingOrThrow)({ bookingId, userId, role });
    switch (booking.type) {
        case 'ACCOMMODATION':
            return (0, accommodation_booking_service_1.cancelAccommodationBookingService)({ bookingId, userId, role });
        case 'TOUR':
            return (0, tour_booking_service_1.cancelTourbooking)({ bookingId, userId, role });
        case 'TRANSFER':
            return (0, booking_service_1.cancelTransferBooking)({ bookingId, userId, role });
        case 'RENTAL':
            return (0, rental_booking_service_1.cancelRentalBooking)({ bookingId, userId, role });
        default:
            throw new Error('Invalid booking type');
    }
}
async function detailedBooking({ bookingId, userId, role, }) {
    const booking = await (0, booking_query_1.findBookingOrThrow)({ bookingId, role, userId });
    switch (booking.type) {
        case 'TOUR':
            return (0, booking_response_mapped_1.mapTourBooking)(booking);
        case 'ACCOMMODATION':
            return (0, booking_response_mapped_1.mapAccommodationBooking)(booking);
        case 'TRANSFER':
            return (0, booking_response_mapped_1.mapTransferBooking)(booking);
        case 'RENTAL':
            return (0, booking_response_mapped_1.mapRentalBooking)(booking);
        default:
            throw new Error('Invalid type');
    }
}
async function expiredBooking(bookingId) {
    const tourBooking = await prisma_1.prisma.tourBooking.findUnique({
        where: { bookingId },
        include: { booking: true },
    });
    if (!tourBooking) {
        throw new Error('Booking not found');
    }
    if (tourBooking.booking.bookingStatus !== 'PENDING') {
        return tourBooking;
    }
    if (tourBooking.booking.expiresAt &&
        tourBooking.booking.expiresAt < new Date()) {
        return tourBooking;
    }
    const interval = (0, helper_1.normalizeInterval)(tourBooking.startDate, tourBooking.endDate);
    const dates = (0, date_fns_1.eachDayOfInterval)(interval);
    return prisma_1.prisma.$transaction(async (tx) => {
        await (0, capacity_query_1.releaseCapacity)({
            tx,
            dates,
            participants: tourBooking.participants,
            tourId: tourBooking.tourId,
            scheduleId: tourBooking.scheduleId,
        });
        const updated = await tx.booking.update({
            where: { id: bookingId },
            data: {
                bookingStatus: 'CANCELLED',
            },
        });
        await (0, booking_audit_service_1.logBookingAction)({
            tx,
            userId: tourBooking.booking.userId,
            role: 'ADMIN',
            newValue: updated,
            action: 'CANCELLED',
        });
        return updated;
    });
}
