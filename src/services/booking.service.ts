import { prisma } from '../config/prisma';
import { normalizeInterval, overlaps } from '../utils/helper';
import { calculateTotalPrice } from './pricing.service';
import { eachDayOfInterval } from 'date-fns';

export async function createBooking(params: {
  userId: string;
  tourId: string;
  pricingType: 'joiner' | 'private';
  participants: number;
  startDate: Date;
  endDate?: Date | null;
}) {
  const { userId, tourId, pricingType, participants } = params;

  const tour = await prisma.tour.findUnique({
    where: { id: tourId },
    select: { id: true, joinerCapacity: true },
  });
  if (!tour) throw new Error('Tour not found');

  const requested = normalizeInterval(params.startDate, params.endDate);

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

  const normalizedExisting = existingBookings.map((b) => ({
    ...b,
    interval: normalizeInterval(b.startDate, b.endDate),
  }));

  if (pricingType === 'private') {
    const conflict = normalizedExisting.find((b) =>
      overlaps(b.interval, requested),
    );
    if (conflict) {
      throw new Error(
        'Date not available: private booking requires exclusive availability.',
      );
    }
  }

  if (pricingType === 'joiner') {
    const days = eachDayOfInterval(requested);

    for (const day of days) {
      const dayInterval = normalizeInterval(day, day);

      const privateConflict = normalizedExisting.find(
        (b) => b.pricingType === 'private' && overlaps(b.interval, dayInterval),
      );

      if (privateConflict) {
        throw new Error(
          'Date not available: private booking exists on the selected date.',
        );
      }

      const used = normalizedExisting.reduce((sum, b) => {
        if (b.pricingType !== 'joiner') return sum;
        return overlaps(b.interval, dayInterval) ? sum + b.participants : sum;
      }, 0);

      if (used + participants > tour.joinerCapacity) {
        const dayStr = day.toISOString().slice(0, 10);
        throw new Error(
          `Capacity exceeded for ${dayStr}: ${used}/${tour.joinerCapacity} already booked.`,
        );
      }
    }
  }

  const pricing = await calculateTotalPrice({
    tourId,
    pricingType,
    participants,
  });

  const booking = await prisma.booking.create({
    data: {
      userId,
      tourId,
      pricingType,
      participants,
      total: pricing.totalPrice,
      startDate: requested.start,
      endDate: params.endDate ? requested.end : null,
    },
    include: {
      tour: {
        select: { id: true, joinerCapacity: true, name: true, slug: true },
      },
    },
  });

  return booking;
}

export async function listMyBookings(userId: string) {
  return prisma.booking.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      tour: {
        select: { id: true, name: true, slug: true },
      },
    },
  });
}
