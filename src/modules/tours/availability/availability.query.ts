import { Prisma, Role } from '../../../generated/prisma/client';
import { logAdminWarning } from '../../logs/admin-warning.service';

export async function checkAvailability({
  tx,
  tourId,
  dates,
  role,
  userId,
}: {
  tx: Prisma.TransactionClient;
  tourId: string;
  dates: Date[];
  role: Role;
  userId: string;
}) {
  const closedDates = await tx.tourAvailability.findMany({
    where: {
      tourId,
      date: { in: dates },
      isClosed: true,
    },
  });

  if (closedDates.length === 0) return;

  if (role === 'USER') {
    throw new Error('One or more dates are blocked');
  }

  for (const entry of closedDates) {
    await logAdminWarning({
      tx,
      actionType: 'FORCED_PRIVATE',
      message: `Admin booked on closed date ${entry.date.toISOString()}`,
      tourId,
      actorId: userId,
      metadata: {
        date: entry.date,
      },
    });
  }
}
