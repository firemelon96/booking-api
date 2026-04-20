import { schedule, validate } from 'node-cron';
import { prisma } from '../config/prisma';
import {
  getTourOrThrow,
  isExpired,
  normalizeInterval,
  sanitizeBooking,
} from '../utils/helper';
import { calculate } from './pricing.service';
import { get } from 'lodash';
import { BOOKING_RULES } from '../constant/constant';
import { startOfDay } from 'date-fns';
import z from 'zod';
import {
  createBookingSchema,
  GetMyBookingsParamType,
  rescheduleBookingSchema,
} from '../validators/booking.schema';
import { decrement, ensureRows, getRows } from './capacity.service';
import { reserve } from './availability.service';
import { Prisma } from '../generated/prisma/client';
import { GetAllBookingParams } from '../validators/admin.schema';

export async function listAllBookings({
  endDate,
  page = 1,
  limit = 10,
  search,
  sort = 'createdAt:desc',
  startDate,
  status,
  tourId,
}: GetAllBookingParams) {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(50, limit);
  const skip = (safePage - 1) * safeLimit;

  const [sortField, sortOrder] = sort.split(':');

  const orderBy = {
    [sortField || 'createdAt']: sortOrder === 'asc' ? 'asc' : 'desc',
  };

  //build filters
  const where: any = {};

  if (tourId) where.tourId = tourId;
  if (status) where.status = status;

  if (startDate || endDate) {
    where.startDate = {};
    if (startDate) where.startDate.gte = startDate;
    if (endDate) where.endDate.lte = endDate;
  }

  //search accross user and tour
  if (search) {
    where.OR = [
      {
        user: {
          name: { contains: search, mode: 'insensitive' },
        },
      },
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
            name: true,
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
      customerName: b.user.name ?? 'Guest',
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

export async function listMyBookings({
  userId,
  endDate,
  limit = 10,
  page = 1,
  startDate,
  status,
  upcoming = true,
}: GetMyBookingsParamType) {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(20, limit);
  const skip = (safePage - 1) * safeLimit;

  const where: any = {
    userId,
  };

  //filter by status
  if (status) {
    where.status = status;
  }

  if (upcoming) {
    where.startDate = {
      gte: new Date(),
    };
  }

  //date range
  if (startDate || endDate) {
    where.startDate = {
      ...(where.startDate || {}),
      ...(startDate && { gte: startDate }),
      ...(endDate && { lte: endDate }),
    };
  }

  const [data, total] = await prisma.$transaction([
    prisma.booking.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: {
        startDate: 'asc',
      },
      include: {
        tour: {
          select: {
            id: true,
            name: true,
            slug: true,
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
      slug: b.tour.slug,
      participants: b.participants,
      pricingType: b.pricingType,
      status: b.status,
      totalPrice: b.totalPrice,
      startDate: b.startDate,
      endDate: b.endDate,
      scheduleId: b.scheduleId,
      createdAt: b.createdAt,
    })),
    meta: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
}

export async function getBookingById(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      tour: {
        select: { id: true, name: true, slug: true },
      },
      user: {
        select: { name: true, email: true },
      },
    },
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  return booking;
}

//NEW LOGIC

export async function createNewBooking({
  participants,
  pricingType,
  startDate,
  endDate,
  notes,
  scheduleId,
  tourId,
  userId,
}: z.infer<typeof createBookingSchema> & { userId: string }) {
  const interval = normalizeInterval(startDate, endDate);

  const tour = await getTourOrThrow(tourId);

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); //15 minutes

  //schedule is provided but does not have schedules link to tour
  if (tour.schedules.length === 0) {
    if (scheduleId) {
      throw new Error('Tour does not require schedule.');
    }

    if (interval.end.getTime() === interval.start.getTime()) {
      throw new Error('Cannot be the same date for multi days');
    }
  }

  //schedule is link with tour, if no schedule selected and does not exist in the tour schedule. guard
  if (tour.schedules.length > 0) {
    if (interval.end.getTime() !== interval.start.getTime()) {
      throw new Error('Cannot have multiple days.');
    }

    if (!scheduleId) {
      throw new Error('Schedule must be selected');
    }

    if (
      !tour.schedules.some((s) => s.id === scheduleId || s.id === 'NO_SCHEDULE')
    ) {
      throw new Error('Invalid schedule selected');
    }
  }

  const scheduleKey = scheduleId ?? 'NO_SCHEDULE';

  return prisma.$transaction(async (tx) => {
    const needsCapacity =
      tour.capacityMode === 'SHARED' ||
      (tour.capacityMode === 'MIXED' && pricingType === 'JOINER');

    if (needsCapacity) {
      await ensureRows({
        tx,
        tourId,
        interval,
        scheduleId,
        scheduleKey,
        capacity: tour.joinerCapacity ?? 0,
      });
    }

    await reserve({
      tx,
      tourId,
      interval,
      participants,
      scheduleId,
      scheduleKey,
      capacityMode: tour.capacityMode,
      pricingType,
    });

    const pricing = await calculate({ tx, participants, pricingType, tourId });

    const createBooking = await tx.booking.create({
      data: {
        tourId,
        userId,
        participants,
        pricingType,
        scheduleId: scheduleId ?? null,
        totalPrice: pricing.totalPrice,
        startDate: interval.start,
        endDate: interval.end ?? null,
        notes: notes ?? null,
        expiresAt,
      },
    });

    await tx.bookingAuditLog.create({
      data: {
        action: 'CREATED',
        actorId: userId,
        actorType: 'USER',
        newValue: createBooking,
        timestamp: new Date(),
        bookingId: createBooking.id,
      },
    });

    return createBooking;
  });
}

export async function rescheduleBooking({
  bookingId,
  newStartDate,
  userId,
  newEndDate,
  reason,
  scheduleId,
}: z.infer<typeof rescheduleBookingSchema> & {
  userId: string;
  bookingId: string;
}) {
  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
  });

  const tour = await getTourOrThrow(booking.tourId);

  const oldInterval = {
    start: booking.startDate,
    end: booking.endDate ?? booking.startDate,
  };

  const newInterval = normalizeInterval(newStartDate, newEndDate);

  if (oldInterval === newInterval) {
    throw new Error('No changes detected');
  }

  const oldSnapshot = sanitizeBooking(booking);

  const scheduleKey = scheduleId ?? 'NO_SCHEDULE';

  if (booking.scheduleId) {
    if (!scheduleId) {
      throw new Error('Provide new schedule');
    }

    if (!tour.schedules.some((s) => s.id === scheduleId)) {
      throw new Error('Invalid schedule selected');
    }
  }

  if (booking.status === 'PENDING') {
    throw new Error('Cannot reschedule pending booking');
  }

  if (booking.status === 'EXPIRED') {
    return booking;
  }

  const cutoff = new Date(
    booking.startDate.getTime() -
      BOOKING_RULES.RESCHEDULE_CUTOFF_HOURS * 60 * 60 * 1000,
  );

  if (new Date() > cutoff) {
    throw new Error(
      `Rescheduling must be done at least ${BOOKING_RULES.RESCHEDULE_CUTOFF_HOURS} hours before the booking start time.`,
    );
  }

  if (booking.rescheduleCount >= BOOKING_RULES.MAX_RESCHEDULES) {
    throw new Error(
      `Maximum reschedule limit of ${BOOKING_RULES.MAX_RESCHEDULES} reached for this booking.`,
    );
  }

  return prisma.$transaction(async (tx) => {
    const needsCapacity =
      tour.capacityMode === 'SHARED' ||
      (tour.capacityMode === 'MIXED' && booking.pricingType === 'JOINER');

    if (needsCapacity) {
      ensureRows({
        tx,
        tourId: tour.id,
        interval: newInterval,
        scheduleId,
        scheduleKey,
        capacity: tour.joinerCapacity ?? 0,
      });
    }

    //reserve New first
    await reserve({
      tx,
      tourId: tour.id,
      pricingType: booking.pricingType,
      capacityMode: tour.capacityMode,
      interval: newInterval,
      participants: booking.participants,
      scheduleId,
      scheduleKey,
      excludeBookingId: booking.id,
    });

    // release OLD ONLY if it used capacity
    const usedCapacity =
      tour.capacityMode === 'SHARED' ||
      (tour.capacityMode === 'MIXED' && booking.pricingType === 'JOINER');

    if (usedCapacity) {
      const oldRows = await getRows({
        tx,
        tourId: tour.id,
        interval: oldInterval,
        scheduleKey,
      });

      await decrement({
        tx,
        rows: oldRows,
        participants: booking.participants,
      });
    }

    const updatedBooking = await tx.booking.update({
      where: { id: booking.id },
      data: {
        startDate: newInterval.start,
        endDate: newInterval.end,
        scheduleId: scheduleId ?? null,
        rescheduleCount: { increment: 1 },
        lastRescheduleDate: new Date(),
      },
    });

    await tx.bookingAuditLog.create({
      data: {
        bookingId: booking.id,
        actorId: userId,
        actorType: 'USER',
        action: 'RESCHEDULED',
        previousValue: oldSnapshot,
        newValue: sanitizeBooking(updatedBooking),
        reason: reason ?? null,
      },
    });

    return updatedBooking;
  });
}

export async function cancelBooking({
  bookingId,
  userId,
}: {
  bookingId: string;
  userId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUniqueOrThrow({
      where: { id: bookingId },
    });

    const tour = await getTourOrThrow(booking.tourId);

    const scheduleKey = booking.scheduleId ?? 'NO_SCHEDULE';
    //protection
    if (booking.status === 'CANCELLED' || booking.status === 'EXPIRED') {
      return booking; // idempotent
    }

    if (booking.startDate < new Date()) {
      throw new Error('Cannot cancel past bookings');
    }

    const cutoff = new Date(
      booking.startDate.getTime() -
        BOOKING_RULES.RESCHEDULE_CUTOFF_HOURS * 60 * 60 * 1000,
    );

    if (new Date() > cutoff) {
      throw new Error(
        `Cancellations must be made at least ${BOOKING_RULES.RESCHEDULE_CUTOFF_HOURS} hours before the booking start time.`,
      );
    }

    const oldSnapshot = sanitizeBooking(booking);

    const interval = {
      start: booking.startDate,
      end: booking.endDate ?? booking.startDate,
    };

    if (
      tour.capacityMode === 'SHARED' ||
      (tour.capacityMode === 'MIXED' && booking.pricingType === 'JOINER')
    ) {
      const rows = await getRows({
        tx,
        tourId: tour.id,
        interval,
        scheduleKey,
      });

      await decrement({
        tx,
        rows,
        participants: booking.participants,
      });
    }

    const cancelledBooking = await tx.booking.update({
      where: { id: booking.id },
      data: { status: 'CANCELLED', canceledAt: new Date() },
    });

    await tx.bookingAuditLog.create({
      data: {
        bookingId: booking.id,
        actorId: userId,
        actorType: 'USER',
        action: 'CANCELLED',
        previousValue: oldSnapshot,
        newValue: sanitizeBooking(cancelledBooking),
      },
    });

    return cancelledBooking;
  });
}

export async function expireBooking({
  tx,
  bookingId,
}: {
  tx: Prisma.TransactionClient;
  bookingId: string;
}) {
  const booking = await tx.booking.findUniqueOrThrow({
    where: { id: bookingId },
  });

  const scheduleKey = booking.scheduleId ?? 'NO_SCHEDULE';

  //idempotent
  if (booking.status !== 'PENDING') return booking;

  if (!isExpired(booking.status, booking.expiresAt)) return booking;

  const tour = await getTourOrThrow(booking.tourId);

  const oldSnapshot = sanitizeBooking(booking);

  const interval = {
    start: booking.startDate,
    end: booking.endDate ?? booking.startDate,
  };

  //release capacity ONLY if used
  if (
    tour.capacityMode === 'SHARED' ||
    (tour.capacityMode === 'MIXED' && booking.pricingType === 'JOINER')
  ) {
    const rows = await getRows({
      tx,
      tourId: tour.id,
      interval,
      scheduleKey,
    });

    await decrement({ tx, rows, participants: booking.participants });
  }

  const updated = await tx.booking.update({
    where: { id: booking.id },
    data: {
      status: 'EXPIRED',
    },
  });

  await tx.bookingAuditLog.create({
    data: {
      bookingId: booking.id,
      action: 'CANCELLED', //TODO add EXPIRED enum
      actorId: 'SYSTEM',
      actorType: 'ADMIN', //TODO add SYSTEM to actor type enum
      previousValue: oldSnapshot,
      newValue: sanitizeBooking(updated),
    },
  });

  return updated;
}
