import { startOfDay } from 'date-fns';
import { PricingType, Prisma } from '../../../generated/prisma/client';
import { logAdminWarning } from '../../logs/admin-warning.service';
import { TransferInventoryInput } from './inventory.type';

export async function ensureTransferInventory(
  tx: Prisma.TransactionClient,
  {
    transferId,
    travelDate,
    maxPassengers,
    scheduleId,
  }: {
    transferId: string;
    travelDate: Date;
    maxPassengers: number;
    scheduleId?: string | null;
  },
) {
  await tx.transferInventory.create({
    data: {
      transferId,
      scheduleId: scheduleId ?? null,
      date: startOfDay(travelDate),
      isClosed: false,
      availableSeats: maxPassengers,
      bookedSeats: 0,
    },
  });
}

export async function lockTransferInventory(
  tx: Prisma.TransactionClient,
  {
    transferId,
    travelDate,
    scheduleId,
  }: { transferId: string; travelDate: Date; scheduleId?: string | null },
) {
  return tx.$queryRaw`
    SELECT id
    FROM "TransferInventory"
    WHERE "transferId" = ${transferId}
    AND "scheduleId" IS NOT DISTINCT FROM ${scheduleId ?? null}
    AND "date" = ${startOfDay(travelDate)}
    FOR UPDATE`;
}

export async function reserveSharedTransferInventory(
  tx: Prisma.TransactionClient,
  {
    transferId,
    scheduleId,
    travelDate,
    passengers,
    isAdmin,
    userId,
  }: {
    transferId: string;
    scheduleId?: string | null;
    travelDate: Date;
    passengers: number;
    isAdmin: boolean;
    userId: string;
  },
) {
  let hasOverbooking = false;
  let hasAdminOverride = false;

  const inventory = await tx.transferInventory.findFirst({
    where: {
      transferId,
      scheduleId: scheduleId ?? null,
      date: startOfDay(travelDate),
    },
  });

  if (!inventory) {
    throw new Error('Transfer inventory not found');
  }

  if (inventory.isClosed) {
    if (!isAdmin) {
      throw new Error('Transfer unavailable');
    }

    hasAdminOverride = true;

    await logAdminWarning({
      tx,
      actionType: 'BOOKED_ON_CLOSED_DATE',
      actorId: userId,
      transferId,
      message: 'Admin booked on closed date',
      metadata: inventory,
    });
  }

  const remainingSeats = inventory.availableSeats - inventory.bookedSeats;

  if (remainingSeats < passengers) {
    if (!isAdmin) {
      throw new Error('Not enough seats available');
    }

    hasOverbooking = true;
    hasAdminOverride = true;

    await logAdminWarning({
      tx,
      actorId: userId,
      actionType: 'OVERBOOKING',
      transferId,
      message: `Admin overbooked transfer of ${inventory.date}`,
      metadata: { passengers, remainingSeats },
    });
  }

  await tx.transferInventory.update({
    where: {
      id: inventory.id,
    },
    data: {
      bookedSeats: {
        increment: passengers,
      },
    },
  });

  return {
    hasAdminOverride,
    hasOverbooking,
  };
}

export async function reservePrivateTransferInventory(
  tx: Prisma.TransactionClient,
  {
    transferId,
    scheduleId,
    travelDate,
    isAdmin,
    userId,
  }: {
    transferId: string;
    scheduleId?: string | null;
    travelDate: Date;
    isAdmin: boolean;
    userId: string;
  },
) {
  let hasOverbooking = false;
  let hasAdminOverride = false;

  const inventory = await tx.transferInventory.findFirst({
    where: {
      transferId,
      scheduleId: scheduleId ?? null,
      date: startOfDay(travelDate),
    },
  });

  if (!inventory) {
    throw new Error('Transfer inventory not found');
  }

  if (inventory.isClosed) {
    if (!isAdmin) {
      throw new Error('Transfer unavailable');
    }

    hasAdminOverride = true;

    await logAdminWarning({
      tx,
      actionType: 'BOOKED_ON_CLOSED_DATE',
      actorId: userId,
      transferId,
      message: 'Admin booked on closed date',
      metadata: inventory,
    });
  }

  const hasConflict = inventory.bookedSeats > 0;

  if (hasConflict) {
    if (!isAdmin) {
      throw new Error('Not enough seats available');
    }

    hasOverbooking = true;
    hasAdminOverride = true;

    await logAdminWarning({
      tx,
      actorId: userId,
      actionType: 'FORCED_PRIVATE',
      transferId,
      message: `Admin forced private transfer of ${inventory.date}`,
      metadata: inventory,
    });
  }

  await tx.transferInventory.update({
    where: {
      id: inventory.id,
    },
    data: {
      bookedSeats: {
        increment: inventory.availableSeats,
      },
    },
  });

  return {
    hasAdminOverride,
    hasOverbooking,
  };
}

export async function reserveTransferInventory(
  tx: Prisma.TransactionClient,
  {
    transferId,
    travelDate,
    isAdmin,
    pricingType,
    userId,
    scheduleId,
    passengers,
  }: {
    transferId: string;
    travelDate: Date;
    isAdmin: boolean;
    pricingType: PricingType;
    userId: string;
    scheduleId?: string | null;
    passengers: number;
  },
) {
  switch (pricingType) {
    case 'JOINER':
      await reserveSharedTransferInventory(tx, {
        transferId,
        scheduleId,
        travelDate,
        isAdmin,
        passengers,
        userId,
      });

    case 'PRIVATE':
      await reservePrivateTransferInventory(tx, {
        transferId,
        scheduleId,
        travelDate,
        isAdmin,
        userId,
      });

    default:
      throw new Error('Invalid pricing type');
  }
}
