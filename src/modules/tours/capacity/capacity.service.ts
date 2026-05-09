import { eachDayOfInterval, startOfDay } from 'date-fns';
import { prisma } from '../../../config/prisma';
import { BulkCapacityParams, CapacityParams } from './capacity.type';
import { normalizeInterval } from '../../../utils/helper';
import { findCapacityOrFail, lockCapacityRows } from './capacity.query';

// export async function upsertCapacity({
//   tourId,
//   date,
//   scheduleId,
//   capacity,
// }: CapacityParams & { tourId: string }) {
//   const scheduleKey = scheduleId ?? 'NO_SCHEDULE';

//   return prisma.tourDailyCapacity.upsert({
//     where: {
//       tourId_date_scheduleKey: {
//         tourId: tourId,
//         date: startOfDay(new Date(date)),
//         scheduleKey,
//       },
//     },
//     update: {
//       capacity,
//     },
//     create: {
//       tourId,
//       date: startOfDay(new Date(date)),
//       scheduleId: scheduleId ?? null,
//       scheduleKey,
//       capacity,
//       booked: 0,
//     },
//   });
// }

export async function bulkSetCapacity({
  tourId,
  startDate,
  endDate,
  capacity,
  scheduleId,
}: BulkCapacityParams) {
  const interval = normalizeInterval(startDate, endDate);

  const dates = eachDayOfInterval(interval);
  const scheduleKey = scheduleId ?? 'NO_SCHEDULE';

  if (capacity < 0) {
    throw new Error('Capacity cannot be negative');
  }

  return prisma.$transaction(async (tx) => {
    //create missiong row
    await tx.tourDailyCapacity.createMany({
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

    const lockRows = await lockCapacityRows(tx, { tourId, dates, scheduleKey });

    const invalidRows = lockRows.filter((row) => row.booked > capacity);

    if (invalidRows.length > 0) {
      throw new Error('Cannot set capacity below booked count.');
    }

    await tx.tourDailyCapacity.updateMany({
      where: {
        tourId,
        date: {
          gte: interval.start,
          lte: interval.end,
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
  });
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

export async function deleteCapacity({ tourId }: { tourId: string }) {
  const row = await prisma.tourDailyCapacity.findFirst({
    where: {
      tourId,
    },
  });

  if (!row) {
    throw new Error('Capacity not found');
  }

  if (row.booked > 0) {
    throw new Error('Cannot reset active booking');
  }

  return prisma.tourDailyCapacity.delete({
    where: {
      id: row.id,
    },
  });
}
