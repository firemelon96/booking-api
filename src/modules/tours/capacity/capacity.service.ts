import { eachDayOfInterval, startOfDay } from 'date-fns';
import { prisma } from '../../../config/prisma';
import { BulkCapacityParams, CapacityParams } from './capacity.type';
import { normalizeInterval } from '../../../utils/helper';
import { findCapacityOrFail } from './capacity.query';

export async function upsertCapacity({
  tourId,
  date,
  scheduleId,
  capacity,
}: CapacityParams & { tourId: string }) {
  const scheduleKey = scheduleId ?? 'NO_SCHEDULE';

  return prisma.tourDailyCapacity.upsert({
    where: {
      tourId_date_scheduleKey: {
        tourId: tourId,
        date: startOfDay(new Date(date)),
        scheduleKey,
      },
    },
    update: {
      capacity,
    },
    create: {
      tourId,
      date: startOfDay(new Date(date)),
      scheduleId: scheduleId ?? null,
      scheduleKey,
      capacity,
      booked: 0,
    },
  });
}

export async function bulkSetCapacity({
  tourId,
  startDate,
  endDate,
  capacity,
  scheduleId,
}: BulkCapacityParams & { tourId: string }) {
  const interval = normalizeInterval(startDate, endDate);

  const dates = eachDayOfInterval(interval);
  const scheduleKey = scheduleId ?? 'NO_SCHEDULE';

  await prisma.tourDailyCapacity.createMany({
    data: dates.map((date) => ({
      tourId,
      date: startOfDay(new Date(date)),
      scheduleId: scheduleId ?? null,
      scheduleKey,
      capacity,
      booked: 0,
    })),
    skipDuplicates: true,
  });

  await prisma.tourDailyCapacity.updateMany({
    where: {
      tourId,
      date: {
        gte: startOfDay(new Date(startDate)),
        lte: startOfDay(new Date(endDate)),
      },
      scheduleKey,
    },
    data: {
      capacity,
    },
  });

  return {
    success: true,
    updatedDates: dates.length,
    capacity,
  };
}

export async function updateCapacity({
  id,
  capacity,
}: {
  id: string;
  capacity: number;
}) {
  await findCapacityOrFail({ id });

  return prisma.tourDailyCapacity.update({
    where: {
      id,
    },
    data: {
      capacity,
    },
  });
}

export async function deleteCapacity({ id }: { id: string }) {
  const cap = await findCapacityOrFail({ id });

  if (cap.booked > 0) {
    throw new Error('Cannot reset active booking');
  }

  return prisma.tourDailyCapacity.delete({
    where: {
      id,
    },
  });
}
