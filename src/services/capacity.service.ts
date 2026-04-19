import { eachDayOfInterval, endOfDay, startOfDay } from 'date-fns';
import { Prisma } from '../generated/prisma/client';
import { prisma } from '../config/prisma';
import { normalizeInterval } from '../utils/helper';
import { boolean, success } from 'zod';

export async function ensureRows({
  tx,
  tourId,
  interval,
  scheduleId,
  capacity,
  scheduleKey,
}: {
  tx: Prisma.TransactionClient;
  tourId: string;
  interval: { start: Date; end: Date };
  scheduleId?: string | null;
  capacity: number;
  scheduleKey: string;
}) {
  const dates = eachDayOfInterval(interval);

  await tx.tourDailyCapacity.createMany({
    data: dates.map((d) => ({
      tourId,
      date: d,
      scheduleId: scheduleId ?? null,
      scheduleKey,
      capacity,
      booked: 0,
    })),
    skipDuplicates: true,
  });
}

export async function getRows({
  tx,
  tourId,
  interval,
  // scheduleId,
  scheduleKey,
}: {
  tx: Prisma.TransactionClient;
  tourId: string;
  interval: { start: Date; end: Date };
  // scheduleId?: string | null;
  scheduleKey: string;
}) {
  return tx.tourDailyCapacity.findMany({
    where: {
      tourId,
      date: {
        gte: interval.start,
        lte: interval.end,
      },
      scheduleKey,
    },
  });
}

export async function increment({
  tx,
  rows,
  participants,
}: {
  tx: Prisma.TransactionClient;
  rows: Awaited<ReturnType<typeof getRows>>;
  participants: number;
}) {
  await Promise.all(
    rows.map((r) =>
      tx.tourDailyCapacity.update({
        where: { id: r.id },
        data: { booked: { increment: participants } },
      }),
    ),
  );
}

export async function decrement({
  tx,
  rows,
  participants,
}: {
  tx: Prisma.TransactionClient;
  rows: Awaited<ReturnType<typeof getRows>>;
  participants: number;
}) {
  await Promise.all(
    rows.map((r) =>
      tx.tourDailyCapacity.update({
        where: { id: r.id },
        data: { booked: { decrement: participants } },
      }),
    ),
  );
}

export async function lock({
  tx,
  tourId,
  interval,
}: {
  tx: Prisma.TransactionClient;
  tourId: string;
  interval: { start: Date; end: Date };
}) {
  await tx.$queryRaw`
      SELECT * FROM "TourDailyCapacity"
      WHERE "tourId" = ${tourId}
      AND date BETWEEN ${interval.start} AND ${interval.end}
      FOR UPDATE
    `;
}

export async function blockDates({
  tourId,
  startDate,
  endDate,
  scheduleId,
}: {
  tourId: string;
  startDate: Date;
  endDate?: Date | null;
  scheduleId?: string | null;
}) {
  const interval = normalizeInterval(startDate, endDate);

  const dates = eachDayOfInterval(interval);

  const scheduleKey = scheduleId ?? 'NO_CHEDULE';

  await prisma.tourDailyCapacity.createMany({
    data: dates.map((date) => ({
      tourId,
      date,
      scheduleId: scheduleId ?? null,
      scheduleKey,
      capacity: 0,
      booked: 0,
    })),
    skipDuplicates: true,
  });

  //also update existing rows
  await prisma.tourDailyCapacity.updateMany({
    where: {
      tourId,
      date: {
        gte: interval.start,
        lte: interval.end,
      },
      scheduleKey,
    },
    data: {
      capacity: 0,
    },
  });

  return {
    success: true,
    blockDates: dates.length,
  };
}

export async function upsertCapacity({
  tourId,
  date,
  scheduleId,
  capacity,
}: {
  tourId: string;
  date: Date;
  scheduleId: string;
  capacity: number;
}) {
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

export async function bulkUpdateCapacity({
  tourId,
  startDate,
  endDate,
  capacity,
  scheduleId,
}: {
  tourId: string;
  startDate: Date;
  endDate: Date;
  capacity: number;
  scheduleId?: string | null;
}) {
  const interval = normalizeInterval(startDate, endDate);

  const dates = eachDayOfInterval(interval);
  const scheduleKey = scheduleId ?? 'NO_SCHEDULE';

  //create missing rows
  await prisma.tourDailyCapacity.createMany({
    data: dates.map((date) => ({
      tourId,
      date,
      scheduleId: scheduleId ?? null,
      scheduleKey,
      capacity,
      booked: 0,
    })),
    skipDuplicates: true,
  });

  //update all rows in range
  await prisma.tourDailyCapacity.updateMany({
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
}
