import { prisma } from '../config/prisma';
import { parseISO, eachDayOfInterval } from 'date-fns';
import { normalizeInterval, overlaps } from '../utils/helper';

type PricingType = 'joiner' | 'private';

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
      (b) => b.pricingType === 'private' && overlaps(b.interval, dayInterval),
    );

    const usedJoiner = normalized.reduce((sum, b) => {
      if (b.pricingType !== 'joiner') return sum;

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
