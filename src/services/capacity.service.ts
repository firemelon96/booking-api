import { eachDayOfInterval, endOfDay, startOfDay } from 'date-fns';
import { Prisma } from '../generated/prisma/client';

export async function ensureRows({
  tx,
  tourId,
  interval,
  scheduleId,
  capacity,
}: {
  tx: Prisma.TransactionClient;
  tourId: string;
  interval: { start: Date; end: Date };
  scheduleId?: string | null;
  capacity: number;
}) {
  const dates = eachDayOfInterval(interval);

  await tx.tourDailyCapacity.createMany({
    data: dates.map((d) => ({
      tourId,
      date: d,
      scheduleId: scheduleId ?? null,
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
  scheduleId,
}: {
  tx: Prisma.TransactionClient;
  tourId: string;
  interval: { start: Date; end: Date };
  scheduleId?: string | null;
}) {
  return tx.tourDailyCapacity.findMany({
    where: {
      tourId,
      date: {
        gte: interval.start,
        lte: interval.end,
      },
      scheduleId: scheduleId ?? null,
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
