import { prisma } from '../config/prisma';
import { calculateTotalPrice } from './pricing.service';

export async function createBooking(params: {
  userId: string;
  tourId: string;
  pricingType: 'joiner' | 'private';
  participants: number;
  startDate: Date;
  endDate?: Date | null;
}) {
  const { userId, tourId, pricingType, participants } = params;

  const tour = await prisma.tour.findUnique({ where: { id: tourId } });
  if (!tour) throw new Error('Tour not found');

  const newStart = params.startDate;
  const newEnd = params.endDate ?? params.startDate;

  const conflict = await prisma.booking.findFirst({
    where: {
      tourId,
      OR: [
        { endDate: { not: null, gte: newStart }, startDate: { lte: newEnd } },
        {
          endDate: null,
          startDate: { gte: newStart, lte: newEnd },
        },
      ],
    },
    select: { id: true, startDate: true, endDate: true },
  });

  if (conflict) {
    throw new Error('Selected date is not available for this tour');
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
      total: pricing.totalPrice,
      startDate: newStart,
      endDate: params.endDate ?? null,
    },
    include: {
      tour: { select: { id: true, name: true, slug: true } },
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
