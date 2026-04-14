import { prisma } from '../config/prisma';
import { parseISO, eachDayOfInterval, startOfDay } from 'date-fns';
import { normalizeInterval, overlaps } from '../utils/helper';
import { PricingType } from '../types/pricing-type';
import { Prisma, Tour } from '../generated/prisma/client';
import { getRows, increment, lock } from './capacity.service';

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function getTourAvailability(params: {
  tourId: string;
  start: string;
  end: string;
  pricingType?: PricingType;
}) {
  const { tourId, start, end, pricingType } = params;

  const tour = await prisma.tour.findUnique({
    where: { id: tourId },
    select: { id: true, joinerCapacity: true },
  });

  if (!tour) throw new Error('Tour not found');

  const range = normalizeInterval(parseISO(start), parseISO(end));
  const days = eachDayOfInterval(range);

  const bookings = await prisma.booking.findMany({
    where: {
      tourId,
      OR: [
        {
          endDate: { not: null, gte: range.start },
          startDate: { lte: range.end },
        },
        {
          endDate: null,
          startDate: { gte: range.start, lte: range.end },
        },
      ],
      ...(pricingType ? { pricingType } : {}),
    },
    select: {
      pricingType: true,
      participants: true,
      startDate: true,
      endDate: true,
    },
  });

  const normalized = bookings.map((b) => ({
    ...b,
    interval: normalizeInterval(b.startDate, b.endDate),
  }));

  const availability = days.map((day) => {
    const dayInterval = normalizeInterval(day, day);

    const hasPrivate = normalized.some(
      (b) => b.pricingType === 'PRIVATE' && overlaps(b.interval, dayInterval),
    );

    const usedJoiner = normalized.reduce((sum, b) => {
      if (b.pricingType !== 'JOINER') return sum;

      return overlaps(b.interval, dayInterval) ? sum + b.participants : sum;
    }, 0);

    const joinerRemaining = Math.max(0, tour.joinerCapacity - usedJoiner);

    return {
      date: dayKey(day),
      privateAvailable: !hasPrivate,
      joinerRemaining,
      joinerAvailable: !hasPrivate && joinerRemaining > 0,
    };
  });

  return availability;
}

export async function reserve({
  tx,
  tourId,
  interval,
  excludeBookingId,
  scheduleId,
  capacityMode,
  participants,
  pricingType,
  scheduleKey,
}: {
  tx: Prisma.TransactionClient;
  tourId: string;
  interval: { start: Date; end: Date };
  excludeBookingId?: string | null;
  scheduleId?: string | null;
  capacityMode: 'EXCLUSIVE' | 'SHARED' | 'MIXED';
  pricingType: 'PRIVATE' | 'JOINER';
  participants: number;
  scheduleKey: string;
}) {
  await lock({ tx, tourId, interval });

  await checkClosedDates({ tx, tourId, interval });

  if (capacityMode === 'EXCLUSIVE') {
    return checkExclusive({
      tx,
      tourId,
      interval,
      excludeBookingId,
      scheduleId: scheduleId ?? null,
    });
  }

  if (capacityMode === 'SHARED') {
    return checkShared({
      tx,
      tourId,
      interval,
      participants,
      scheduleId,
      excludeBookingId,
      scheduleKey,
    });
  }

  if (capacityMode === 'MIXED') {
    if (pricingType === 'PRIVATE') {
      return checkExclusive({
        tx,
        tourId,
        interval,
        excludeBookingId,
        scheduleId: scheduleId ?? null,
      });
    }

    return checkShared({
      tx,
      tourId,
      interval,
      participants,
      scheduleId,
      excludeBookingId,
      scheduleKey,
    });
  }
}

async function checkClosedDates({
  tx,
  tourId,
  interval,
}: {
  tx: Prisma.TransactionClient;
  tourId: string;
  interval: { start: Date; end: Date };
}) {
  const closed = await tx.tourAvailability.findFirst({
    where: {
      tourId,
      date: {
        gte: interval.start,
        lte: interval.end,
      },
    },
  });

  if (closed) throw new Error('Date is closed.');
}

async function checkExclusive({
  tx,
  tourId,
  interval,
  excludeBookingId,
  scheduleId,
}: {
  tx: Prisma.TransactionClient;
  tourId: string;
  interval: { start: Date; end: Date };
  excludeBookingId?: string | null;
  scheduleId: string | null;
}) {
  const conflict = await tx.booking.findFirst({
    where: {
      tourId,
      status: { in: ['PENDING', 'CONFIRMED'] },
      ...(excludeBookingId && { NOT: { id: excludeBookingId } }),
      startDate: { lte: interval.end },
      endDate: { gte: interval.start },
    },
  });

  if (conflict) throw new Error('Dates are already booked (exclusive mode)');
}

async function checkShared({
  tx,
  tourId,
  interval,
  participants,
  scheduleId,
  excludeBookingId,
  scheduleKey,
}: {
  tx: Prisma.TransactionClient;
  tourId: string;
  interval: { start: Date; end: Date };
  participants: number;
  scheduleId?: string | null;
  excludeBookingId?: string | null;
  scheduleKey: string;
}) {
  const privateConflict = await tx.booking.findFirst({
    where: {
      tourId,
      pricingType: 'PRIVATE',
      status: { in: ['CONFIRMED', 'PENDING'] },
      ...(excludeBookingId && { NOT: { id: excludeBookingId } }),
      startDate: { lte: interval.end },
      endDate: { gte: interval.start },
      scheduleId: scheduleId ?? null,
    },
  });

  if (privateConflict) throw new Error('Date has a private booking');

  const days = eachDayOfInterval(interval);

  const rows = await getRows({ tx, tourId, interval, scheduleKey });

  const map = new Map(rows.map((r) => [r.date.getTime(), r]));

  for (const day of days) {
    const row = map.get(day.getTime());

    if (!row) throw new Error('Capacity not initialized');

    if (row.booked + participants > row.capacity) {
      throw new Error(`Capacity exceeded on ${day.toISOString()}`);
    }
  }

  await increment({ tx, rows, participants });
}
