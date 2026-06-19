import { Prisma } from '../../../generated/prisma/client';
import { logAdminWarning } from '../../logs/admin-warning.service';

export async function ensureRentalInventory(
  tx: Prisma.TransactionClient,
  {
    itemId,
    dates,
    quantity,
  }: { itemId: string; dates: Date[]; quantity: number },
) {
  return tx.rentalInventory.createMany({
    data: dates.map((date) => ({
      rentalItemId: itemId,
      date,
      availableUnits: quantity,
      bookedUnits: 0,
    })),
    skipDuplicates: true,
  });
}

export async function lockRentalInventory(
  tx: Prisma.TransactionClient,
  { itemId, dates }: { itemId: string; dates: Date[] },
) {
  for (const date of dates) {
    await tx.$queryRaw`
    SELECT id
    FROM "RentalInventory"
    WHERE "rentalItemId" = ${itemId}
    AND "date" = ${date}
    FOR UPDATE
    `;
  }
}

export async function reserveRentalInventory(
  tx: Prisma.TransactionClient,
  {
    itemId,
    dates,
    isAdmin,
    userId,
    quantity,
  }: {
    itemId: string;
    dates: Date[];
    isAdmin: boolean;
    userId: string;
    quantity: number;
  },
) {
  let hasOverbooking = false;
  let hasAdminOverride = false;

  for (const date of dates) {
    const row = await tx.rentalInventory.findFirst({
      where: {
        rentalItemId: itemId,
        date,
      },
    });

    if (!row) {
      throw new Error('Item inventory not found');
    }

    if (row.isClosed) {
      if (!isAdmin) {
        throw new Error('Date is closed');
      }

      hasAdminOverride = true;

      //log warning
      await logAdminWarning({
        tx,
        actionType: 'BOOKED_ON_CLOSED_DATE',
        message: `Admin booked on closed date ${row.date}`,
        actorId: userId,
        metadata: row,
      });
    }

    const remaining = row.availableUnits - row.bookedUnits;

    if (remaining < quantity) {
      if (!isAdmin) {
        throw new Error('Item is not available');
      }

      hasAdminOverride = true;
      hasOverbooking = true;

      //log warning
      await logAdminWarning({
        tx,
        actionType: 'OVERBOOKING',
        message: `Admin overbooked on ${row.date}`,
        actorId: userId,
        metadata: row,
      });
    }

    await tx.rentalInventory.update({
      where: {
        id: row.id,
      },
      data: {
        bookedUnits: {
          increment: quantity,
        },
      },
    });
  }

  return {
    hasAdminOverride,
    hasOverbooking,
  };
}

export async function releaseRentalInventory(
  tx: Prisma.TransactionClient,
  {
    itemId,
    dates,
    quantity,
  }: {
    itemId: string;
    dates: Date[];
    quantity: number;
  },
) {
  for (const date of dates) {
    await tx.rentalInventory.updateMany({
      where: {
        rentalItemId: itemId,
        date,
      },
      data: {
        bookedUnits: {
          decrement: quantity,
        },
      },
    });
  }
}
