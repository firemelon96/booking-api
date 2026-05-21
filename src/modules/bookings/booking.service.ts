import { eachDayOfInterval } from 'date-fns';
import { prisma } from '../../config/prisma';
import { CancellationRefundType, Role } from '../../generated/prisma/enums';
import { normalizeInterval } from '../../utils/helper';
import { findTourOrFail } from '../tours/tour.query';
import {
  BookingInputType,
  BookingQueryType,
  RescheduleBookingPayload,
} from './booking.type';
import {
  validateBookingRules,
  validateCancelRules,
  validateRescheduleRules,
} from './booking.rule';
import { checkAvailability } from '../tours/availability/availability.query';
import {
  lockCapacityRows,
  prepareCapacity,
  releaseCapacity,
  reserveCapacity,
} from '../tours/capacity/capacity.query';
import { calculate } from '../tours/pricing/pricing.query';
import { logBookingAction } from './audit/booking-audit.service';
import {
  calculateCancellationRefund,
  createUniqueBookingReference,
  findBookingOrThrow,
  findTourBookingOrThrow,
} from './booking.query';
import {
  mapAccommodationBooking,
  mapTourBooking,
} from './booking-response.mapped';
import { reschedAccommodationBooking } from '../accommodations/booking/accommodation-booking.service';
import { rescheduleTourBooking } from '../tours/booking/tour-booking.service';

export async function getAllBookings({
  userId,
  role,
  startDate,
  endDate,
  page = 1,
  limit = 10,
  search,
  sort = 'createdAt:desc',
  status,
  tourId,
}: BookingQueryType) {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(50, limit);
  const skip = (safePage - 1) * safeLimit;

  const [sortField, sortOrder] = sort.split(':');

  const orderBy = {
    [sortField || 'createdAt']: sortOrder === 'asc' ? 'asc' : 'desc',
  };

  const where: any = {};

  if (role === 'USER') {
    where.userId = userId;

    if (search) {
      where.OR = [
        {
          tour: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
        {
          tour: {
            description: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }
  }

  if (tourId) where.tourId = tourId;
  if (status) where.status = status;

  if (startDate || endDate) {
    where.startDate = {};
    if (startDate) where.startDate.gte = startDate;
    if (endDate) where.endDate.lte = endDate;
  }

  if (search) {
    where.OR = [
      {
        user: {
          email: { contains: search, mode: 'insensitive' },
        },
      },
      {
        tour: {
          name: { contains: search, mode: 'insensitive' },
        },
      },
    ];
  }

  const [data, total] = await prisma.$transaction([
    prisma.booking.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy,
      include: {
        user: true,
        tourBooking: true,
        accommodationBooking: true,
      },
    }),
    prisma.booking.count({ where }),
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
      checkIn: b.accommodationBooking?.checkIn,
      checkOut: b.accommodationBooking?.checkOut,
      expiresAt:
        b.expiresAt && b.expiresAt?.getTime() < new Date(Date.now()).getTime()
          ? 'expired'
          : b.expiresAt,
      startDate: b.tourBooking?.startDate,
      endDate: b.tourBooking?.endDate,
      specialRequests: b.accommodationBooking?.specialRequests,
      notes: b.tourBooking?.notes,
    })),

    meta: {
      total,
      page: safePage,
      pageSize: safeLimit,
      pageCount: Math.ceil(total / safeLimit),
    },
  };
}

export async function getBookingByReference(reference: string) {
  const booking = await prisma.booking.findUnique({
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
      return mapTourBooking(booking);
    case 'ACCOMMODATION':
      return mapAccommodationBooking(booking);
    default:
      throw new Error('Booking does not exist');
  }
}

export async function rescheduleBooking(
  bookingId: string,
  userId: string,
  role: Role,
  payload: RescheduleBookingPayload,
) {
  const booking = await findBookingOrThrow({ bookingId, role, userId });

  switch (booking.type) {
    case 'ACCOMMODATION':
      return reschedAccommodationBooking(bookingId, userId, role, {
        checkIn: payload.checkIn!,
        checkOut: payload.checkOut!,
      });
    case 'TOUR':
      return rescheduleTourBooking(bookingId, userId, role, {
        newEndDate: payload.endDate!,
        newStartDate: payload.startDate!,
        scheduleId: payload.scheduleId,
      });

    default:
      throw new Error('Invalid booking type');
  }
}

export async function cancelbooked({
  bookingId,
  userId,
  role,
}: BookingInputType) {
  const tourBooking = await findTourBookingOrThrow({
    bookingId,
    userId,
    role,
  });

  validateCancelRules({
    existingBooking: tourBooking.booking,
    tourBooking,
  });

  const interval = normalizeInterval(
    tourBooking.startDate,
    tourBooking.endDate,
  );

  const dates = eachDayOfInterval(interval);

  return prisma.$transaction(async (tx) => {
    const policy = await tx.cancellationPolicy.findUnique({
      where: { tourId: tourBooking.tourId },
    });

    if (!policy) {
      throw new Error('Policy not found');
    }

    const { refundAmount, refundPercentage, refundType } =
      calculateCancellationRefund({
        bookingDate: tourBooking.createdAt,
        tourStartDate: interval.start,
        totalPrice: Number(tourBooking.booking.totalPrice),
        policy,
      });

    await releaseCapacity({
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
        canceledAt: new Date(),
        cancellationRefundType: refundType as CancellationRefundType,
        cancellationRefundPercentage: refundPercentage,
        isAdminOverride: role === 'ADMIN',
      },
    });

    await logBookingAction({
      tx,
      userId,
      role,
      newValue: cancelled,
      action: 'CANCELLED',
    });

    return cancelled;
  });
}

export async function detailedBooking({
  bookingId,
  userId,
  role,
}: BookingInputType) {
  const booking = await findBookingOrThrow({ bookingId, role, userId });

  switch (booking.type) {
    case 'TOUR':
      return mapTourBooking(booking);

    case 'ACCOMMODATION':
      return mapAccommodationBooking(booking);

    default:
      throw new Error('Invalid type');
  }

  // return {
  //   tourName: tourBooking.tour.name,
  //   location: tourBooking.tour.location,
  //   tourType: tourBooking.tour.type,
  //   duration: tourBooking.tour.durationDays,
  //   participants: tourBooking.participants,
  //   totalPrice: tourBooking.booking.totalPrice,
  //   status: tourBooking.booking.bookingStatus,
  //   startDate: tourBooking.startDate,
  //   endDate: tourBooking.endDate,
  //   scheduleId: tourBooking.scheduleId,
  //   pricingType: tourBooking.pricingType,
  // };
}

export async function expiredBooking(bookingId: string) {
  const tourBooking = await prisma.tourBooking.findUnique({
    where: { bookingId },
    include: { booking: true },
  });

  if (!tourBooking) {
    throw new Error('Booking not found');
  }

  if (tourBooking.booking.bookingStatus !== 'PENDING') {
    return tourBooking;
  }

  if (
    tourBooking.booking.expiresAt &&
    tourBooking.booking.expiresAt < new Date()
  ) {
    return tourBooking;
  }

  const interval = normalizeInterval(
    tourBooking.startDate,
    tourBooking.endDate,
  );

  const dates = eachDayOfInterval(interval);

  return prisma.$transaction(async (tx) => {
    await releaseCapacity({
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

    await logBookingAction({
      tx,
      userId: tourBooking.booking.userId,
      role: 'ADMIN',
      newValue: updated,
      action: 'CANCELLED',
    });

    return updated;
  });
}
