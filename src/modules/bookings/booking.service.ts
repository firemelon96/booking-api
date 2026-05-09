import { eachDayOfInterval } from 'date-fns';
import { prisma } from '../../config/prisma';
import { Role } from '../../generated/prisma/enums';
import { normalizeInterval } from '../../utils/helper';
import { findTourOrFail } from '../tours/tour.query';
import {
  BookingCancelInput,
  BookingCreateInput,
  BookingDetailInput,
  BookingQueryType,
  BookingReschedInput,
} from './booking.type';
import {
  validateBookingRules,
  validateCancelRules,
  validateRescheduleRules,
} from './booking.rule';
import { checkAvailability } from '../tours/availability/availability.query';
import {
  prepareCapacity,
  releaseCapacity,
  reserveCapacity,
} from '../tours/capacity/capacity.query';
import { calculate } from '../tours/pricing/pricing.query';
import { logBookingAction } from './audit/booking-audit.service';
import { findBookingOrThrow } from './booking.query';

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
        tour: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    }),
    prisma.booking.count({ where }),
  ]);

  return {
    data: data.map((b) => ({
      id: b.id,
      tourName: b.tour.name,
      email: b.user.email ?? '',
      participants: b.participants,
      pricingType: b.pricingType,
      status: b.status,
      totalPrice: b.totalPrice,
      startDate: b.startDate,
      endDate: b.endDate,
      createdAt: b.createdAt,
    })),

    meta: {
      total,
      page: safePage,
      pageSize: safeLimit,
      pageCount: Math.ceil(total / safeLimit),
    },
  };
}

export async function createBooking({
  startDate,
  endDate,
  participants,
  pricingType,
  tourId,
  notes,
  scheduleId,
  userId,
  role,
}: BookingCreateInput) {
  const interval = normalizeInterval(startDate, endDate);
  const tour = await findTourOrFail(tourId);

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
  // const scheduleKey = scheduleId ?? 'NO_SCHEDULE';

  validateBookingRules({
    scheduleId: scheduleId ?? null,
    participants,
    durationDays: tour.durationDays ?? undefined,
    schedules: tour.schedules,
    interval,
  });

  const dates = eachDayOfInterval(interval);

  return prisma.$transaction(async (tx) => {
    await checkAvailability({ tx, tourId, dates, role, userId });

    const capacityContext = await prepareCapacity({
      tx,
      tourId,
      scheduleId: scheduleId ?? null,
      joinerCapacity: tour.joinerCapacity,
      dates,
    });

    const { hasOverbooking, hasConflict } = await reserveCapacity({
      tx,
      capacityMode: tour.capacityMode,
      dates,
      participants,
      ctx: capacityContext,
      pricingType,
      role,
      userId,
    });

    const pricing = await calculate({
      tx,
      tourId,
      pricingType,
      participants,
    });

    const booking = await tx.booking.create({
      data: {
        tourId,
        userId,
        participants,
        pricingType,
        totalPrice: pricing.totalPrice,
        startDate: interval.start,
        endDate: interval.end,
        notes,
        isOverbooked: hasOverbooking,
        isAdminOverride: role === 'ADMIN',
        scheduleId: scheduleId || null,
        expiresAt,
        status: 'PENDING',
      },
    });

    await logBookingAction({
      tx,
      userId,
      role,
      newValue: booking,
      action: 'CREATED',
    });

    return { booking, hasConflict };
  });
}

export async function rescheduleBooking({
  bookingId,
  newEndDate,
  newStartDate,
  scheduleId,
  userId,
  role,
}: BookingReschedInput) {
  const existingBooking = await findBookingOrThrow({
    bookingId,
    role,
    userId,
  });

  const tour = await findTourOrFail(existingBooking.tourId);

  const newInterval = normalizeInterval(newStartDate, newEndDate);

  const { datesToRelease, datesToReserve } = validateRescheduleRules(
    existingBooking,
    newInterval,
  );

  return prisma.$transaction(async (tx) => {
    await checkAvailability({
      tx,
      tourId: existingBooking.tourId,
      dates: datesToReserve,
      role,
      userId,
    });

    const capacityContext = await prepareCapacity({
      tx,
      tourId: existingBooking.tourId,
      scheduleId: scheduleId ?? null,
      joinerCapacity: tour.joinerCapacity ?? 0,
      dates: datesToReserve,
    });

    const { hasOverbooking } = await reserveCapacity({
      tx,
      capacityMode: tour.capacityMode,
      dates: datesToReserve,
      participants: existingBooking.participants,
      ctx: capacityContext,
      pricingType: existingBooking.pricingType,
      role,
      userId,
    });

    await releaseCapacity({
      tx,
      dates: datesToRelease,
      participants: existingBooking.participants,
      scheduleId,
      tourId: existingBooking.tourId,
    });

    //no need for calculation

    const resched = await tx.booking.update({
      where: { id: bookingId },
      data: {
        startDate: newInterval.start,
        endDate: newInterval.end,
        scheduleId: scheduleId ?? null,
        rescheduleCount: { increment: 1 },
        lastRescheduleDate: new Date(),
        isOverbooked: hasOverbooking,
        isAdminOverride: role === 'ADMIN',
      },
    });

    await logBookingAction({
      tx,
      userId,
      role,
      previousValue: existingBooking,
      newValue: resched,
      action: 'RESCHEDULED',
    });

    return resched;
  });
}

export async function cancelbooked({
  bookingId,
  userId,
  role,
}: BookingCancelInput) {
  const existingBooking = await findBookingOrThrow({ bookingId, userId, role });

  validateCancelRules({ existingBooking });

  const interval = normalizeInterval(
    existingBooking.startDate,
    existingBooking.endDate,
  );

  const dates = eachDayOfInterval(interval);

  return prisma.$transaction(async (tx) => {
    await releaseCapacity({
      tx,
      dates,
      participants: existingBooking.participants,
      tourId: existingBooking.tourId,
      scheduleId: existingBooking.scheduleId,
    });

    const updated = await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
      },
    });

    await logBookingAction({
      tx,
      userId,
      role,
      newValue: updated,
      action: 'CANCELLED',
    });

    return updated;
  });
}

export async function detailedBooking({
  bookingId,
  userId,
  role,
}: BookingDetailInput) {
  let booking;

  if (role === 'ADMIN') {
    booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { tour: true, user: true },
    });
  } else {
    booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId,
      },
      include: { tour: true, user: true },
    });
  }

  if (!booking) {
    throw new Error('No booking found');
  }

  return {
    tourName: booking?.tour.name,
    location: booking?.tour.location,
    tourType: booking?.tour.type,
    duration: booking?.tour.durationDays,
    participants: booking?.participants,
    userEmail: booking?.user.email,
    totalPrice: booking?.totalPrice,
    status: booking?.status,
    startDate: booking?.startDate,
    endDate: booking?.endDate,
    scheduleId: booking?.scheduleId,
    pricingType: booking?.pricingType,
  };
}

export async function expiredBooking(bookingId: string) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

  if (!booking) {
    throw new Error('Booking not found');
  }

  if (booking.status !== 'PENDING') {
    return booking;
  }

  if (booking.expiresAt && booking.expiresAt < new Date()) {
    return booking;
  }

  const interval = normalizeInterval(booking.startDate, booking.endDate);

  const dates = eachDayOfInterval(interval);

  return prisma.$transaction(async (tx) => {
    await releaseCapacity({
      tx,
      dates,
      participants: booking.participants,
      tourId: booking.tourId,
      scheduleId: booking.scheduleId,
    });

    const updated = await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
      },
    });

    await logBookingAction({
      tx,
      userId: booking.userId,
      role: 'ADMIN',
      newValue: updated,
      action: 'CANCELLED',
    });

    return updated;
  });
}
