import { eachDayOfInterval, startOfDay } from 'date-fns';
import { prisma } from '../../../config/prisma';
import { BulkCapacityParams, CapacityParams } from './capacity.type';
import { normalizeInterval } from '../../../utils/helper';
import {
  findCapacityOrFail,
  lockCapacityRows,
  prepareCapacity,
} from './capacity.query';

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

  if (capacity < 0) {
    throw new Error('Capacity cannot be negative');
  }

  return prisma.$transaction(async (tx) => {
    //create missiong row
    await prepareCapacity({ tx, tourId, scheduleId, capacity, dates });

    const result = await tx.tourDailyCapacity.updateMany({
      where: {
        tourId,
        scheduleId,
        date: { gte: interval.start, lte: interval.end },
        bookedSlots: {
          lte: capacity,
        },
      },
      data: {
        availableSlots: capacity,
      },
    });

    const expected = dates.length;

    if (result.count !== expected) {
      throw new Error('Cannot set capacity below booked count.');
    }

    return {
      success: true,
      updatedDates: result.count,
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
      bookedSlots: capacity,
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

  if (row.bookedSlots > 0) {
    throw new Error('Cannot reset active booking');
  }

  return prisma.tourDailyCapacity.delete({
    where: {
      id: row.id,
    },
  });
}
