import { eachDayOfInterval, endOfDay, startOfDay } from 'date-fns';
import { Prisma } from '../generated/prisma/client';

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
