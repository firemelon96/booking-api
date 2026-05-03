import { eachDayOfInterval } from 'date-fns';
import { normalizeInterval } from '../../../utils/helper';
import { BlockDatesParams } from './availability.type';
import { prisma } from '../../../config/prisma';

export async function closeDates({
  tourId,
  startDate,
  endDate,
  reason,
}: BlockDatesParams & { tourId: string }) {
  const interval = normalizeInterval(startDate, endDate);
  const dates = eachDayOfInterval(interval);

  await prisma.tourAvailability.createMany({
    data: dates.map((date) => ({
      tourId,
      date,
      isClosed: true,
      reason: reason ?? null,
    })),
    skipDuplicates: true,
  });

  await prisma.tourAvailability.updateMany({
    where: {
      tourId,
      date: {
        gte: interval.start,
        lte: interval.end,
      },
    },
    data: {
      isClosed: true,
      reason: reason ?? null,
    },
  });

  return { success: true, blockedDates: dates.length };
}

export async function openDates({
  tourId,
  startDate,
  endDate,
  reason,
}: BlockDatesParams & { tourId: string }) {
  const interval = normalizeInterval(startDate, endDate);

  await prisma.tourAvailability.updateMany({
    where: {
      tourId,
      date: {
        gte: interval.start,
        lte: interval.end,
      },
    },
    data: {
      isClosed: false,
      reason: reason ?? null,
    },
  });

  return { success: true };
}
