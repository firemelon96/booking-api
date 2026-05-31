import { eachDayOfInterval } from 'date-fns';
import { prisma } from '../../config/prisma';
import { Role } from '../../generated/prisma/enums';
import { normalizeInterval } from '../../utils/helper';
import {
  BookingInputType,
  BookingQueryType,
  RescheduleBookingPayload,
} from './booking.type';
import { releaseCapacity } from '../tours/capacity/capacity.query';
import { logBookingAction } from './audit/booking-audit.service';
import { findBookingOrThrow } from './booking.query';
import {
  mapAccommodationBooking,
  mapTourBooking,
  mapTransferBooking,
} from './booking-response.mapped';
import {
  cancelAccommodationBookingService,
  reschedAccommodationBooking,
} from '../accommodations/booking/accommodation-booking.service';
import {
  cancelTourbooking,
  rescheduleTourBooking,
} from '../tours/booking/tour-booking.service';
import {
  cancelTransferBooking,
  rescheduleTransferBooking,
} from '../transfers/bookings/booking.service';

export async function getAllBookingsService(
  userId: string,
  role: Role,
  {
    page = 1,
    limit = 10,
    search,
    sort = 'createdAt:desc',
    bookingStatus,
    paymentStatus,
    reference,
    type,
  }: BookingQueryType,
) {
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
  }

  if (bookingStatus) where.bookingStatus = bookingStatus;
  if (paymentStatus) where.paymentStatus = paymentStatus;
  if (reference) where.reference = reference;
  if (type) where.type = type;

  if (search) {
    where.OR = [
      {
        paidAmount: { contains: search, mode: 'insensitive' },
      },
      {
        remainingBalance: { contains: search, mode: 'insensitive' },
      },
      {
        type: { contains: search, mode: 'insensitive' },
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

    case 'TRANSFER':
      return rescheduleTransferBooking(bookingId, userId, role, {
        travelDate: payload.travelDate!,
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
  const booking = await findBookingOrThrow({ bookingId, userId, role });

  switch (booking.type) {
    case 'ACCOMMODATION':
      return cancelAccommodationBookingService({ bookingId, userId, role });

    case 'TOUR':
      return cancelTourbooking({ bookingId, userId, role });

    case 'TRANSFER':
      return cancelTransferBooking({ bookingId, userId, role });

    default:
      throw new Error('Invalid booking type');
  }
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

    case 'TRANSFER':
      return mapTransferBooking(booking);

    default:
      throw new Error('Invalid type');
  }
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
