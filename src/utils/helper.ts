import {
  areIntervalsOverlapping,
  eachDayOfInterval,
  Interval,
  startOfDay,
} from 'date-fns';
import { prisma } from '../config/prisma';

export function normalizeInterval(start: Date, end?: Date | null) {
  const s = startOfDay(start);
  const e = startOfDay(end ?? start);
  return { start: s, end: e };
}

export function overlaps(
  a: { start: Date; end: Date },
  b: { start: Date; end: Date },
) {
  return areIntervalsOverlapping(a, b, { inclusive: true });
}

export async function getTourOrThrow(tourId: string) {
  const tour = await prisma.tour.findUnique({
    where: { id: tourId },
    select: { id: true, joinerCapacity: true, pricing: true },
  });

  if (!tour) throw new Error('Tour not found');
  return tour;
}

export async function getExistingBookings(
  tourId: string,
  requested: { start: Date; end: Date },
) {
  const existingBookings = await prisma.booking.findMany({
    where: {
      tourId,
      OR: [
        {
          endDate: { not: null, gte: requested.start },
          startDate: { lte: requested.end },
        },
        {
          endDate: null,
          startDate: { gte: requested.start, lte: requested.end },
        },
      ],
    },
    select: {
      id: true,
      pricingType: true,
      participants: true,
      startDate: true,
      endDate: true,
    },
  });

  return existingBookings.map((b) => ({
    ...b,
    interval: normalizeInterval(b.startDate, b.endDate),
  }));
}

export function validateAvailability(
  pricingType: 'JOINER' | 'PRIVATE',
  existingBookings: Awaited<ReturnType<typeof getExistingBookings>>,
  requestedInterval: { start: Date; end: Date },
  joinerCapacity: number,
  participants: number,
) {
  if (pricingType === 'PRIVATE') {
    const conflict = existingBookings.find((b) =>
      overlaps(b.interval, requestedInterval),
    );
    if (conflict) {
      throw new Error(
        'Date not available: private booking requires exclusive availability.',
      );
    }
  }

  if (pricingType === 'JOINER') {
    const days = eachDayOfInterval(requestedInterval);

    for (const day of days) {
      const dayInterval = normalizeInterval(day, day);

      const privateConflict = existingBookings.find(
        (b) => b.pricingType === 'PRIVATE' && overlaps(b.interval, dayInterval),
      );

      if (privateConflict) {
        throw new Error(
          'Date not available: private booking exists on the selected date.',
        );
      }

      const used = existingBookings.reduce((sum, b) => {
        if (b.pricingType !== 'JOINER') return sum;
        return overlaps(b.interval, dayInterval) ? sum + b.participants : sum;
      }, 0);

      if (used + participants > joinerCapacity) {
        const dayStr = day.toISOString().slice(0, 10);
        throw new Error(
          `Capacity exceeded for ${dayStr}: ${used}/${joinerCapacity} already booked.`,
        );
      }
    }
  }
}
