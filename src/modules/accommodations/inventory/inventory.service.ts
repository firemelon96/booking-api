import { Prisma } from '../../../generated/prisma/client';
import { logAdminWarning } from '../../logs/admin-warning.service';

export async function ensureAccommodationInventoryRows(
  tx: Prisma.TransactionClient,
  { accommodationId, dates }: { accommodationId: string; dates: Date[] },
) {
  await tx.accommodationInventory.createMany({
    data: dates.map((date) => ({
      accommodationId,
      date,
      availableUnits: 1,
      bookedUnits: 0,
    })),
    skipDuplicates: true,
  });
}

export async function ensureUnitInventoryRows(
  tx: Prisma.TransactionClient,
  {
    unitId,
    dates,
    quantity,
  }: { unitId: string; dates: Date[]; quantity: number },
) {
  await tx.accommodationUnitInventory.createMany({
    data: dates.map((date) => ({
      unitId,
      date,
      availableUnits: quantity,
      bookedUnits: 0,
    })),
    skipDuplicates: true,
  });
}

export async function reserveAccommodationInventory(
  tx: Prisma.TransactionClient,
  {
    accommodationId,
    dates,
    units,
    userId,
    isAdmin,
  }: {
    accommodationId: string;
    dates: Date[];
    units: number;
    userId: string;
    isAdmin: boolean;
  },
) {
  let hasOverbooking = false;
  let adminOverride = false;

  for (const date of dates) {
    const row = await tx.accommodationInventory.findFirst({
      where: {
        accommodationId,
        date,
      },
    });

    if (!row) {
      throw new Error('Inventory not found');
    }

    if (row.isClosed) {
      if (!isAdmin) {
        throw new Error('Date is closed');
      }

      adminOverride = true;

      await logAdminWarning({
        tx,
        actionType: 'BOOKED_ON_CLOSED_DATE',
        actorId: userId,
        message: `Admin booked accommodation on closed date ${row.date}`,
        accommodationId,
        metadata: row,
      });
    }

    const remaining = row.availableUnits - row.bookedUnits;
    const willOverbooked = remaining < units;

    if (willOverbooked) {
      if (!isAdmin) {
        throw new Error('Not enough inventory');
      }

      adminOverride = true;
      hasOverbooking = true;

      await logAdminWarning({
        tx,
        actionType: 'OVERBOOKING',
        message: `Admin overbooked accommodation on ${row.date}`,
        actorId: userId,
        accommodationId,
        metadata: row,
      });
    }

    await tx.accommodationInventory.update({
      where: { id: row.id },
      data: {
        bookedUnits: {
          increment: units,
        },
      },
    });
  }
  return { hasOverbooking, adminOverride };
}

export async function reserveUnitInventory(
  tx: Prisma.TransactionClient,
  {
    unitId,
    dates,
    units,
    isAdmin,
    userId,
  }: {
    unitId: string;
    dates: Date[];
    units: number;
    isAdmin: boolean;
    userId: string;
  },
) {
  let hasOverbooking = false;
  let adminOverride = false;

  for (const date of dates) {
    const row = await tx.accommodationUnitInventory.findFirst({
      where: {
        unitId,
        date,
      },
    });

    if (!row) {
      throw new Error('Unit inventory not found');
    }

    if (row.isClosed) {
      if (!isAdmin) {
        throw new Error('Date is closed');
      }

      adminOverride = true;

      await logAdminWarning({
        tx,
        actionType: 'BOOKED_ON_CLOSED_DATE',
        message: `Admin booked unit on closed date ${row.date}`,
        actorId: userId,
        unitId: row.id,
        metadata: row,
      });
    }

    const remaining = row.availableUnits - row.bookedUnits;

    if (remaining < units) {
      if (!isAdmin) {
        throw new Error('Unit is fully booked');
      }

      adminOverride = true;
      hasOverbooking = true;

      await logAdminWarning({
        tx,
        actionType: 'OVERBOOKING',
        message: `Admin overbooked unit on ${row.date}`,
        actorId: userId,
        metadata: row,
      });
    }

    await tx.accommodationUnitInventory.update({
      where: {
        id: row.id,
      },
      data: {
        bookedUnits: {
          increment: units,
        },
      },
    });
  }
  return {
    hasOverbooking,
    adminOverride,
  };
}

export async function calculateAccommodationPricing(
  tx: Prisma.TransactionClient,
  {
    accommodation,
    unit,
    dates,
    units,
  }: { accommodation: any; unit?: any; dates: Date[]; units: number },
) {
  let total = 0;

  for (const date of dates) {
    if (unit) {
      const inventory = await tx.accommodationUnitInventory.findFirst({
        where: {
          unitId: unit.id,
          date,
        },
      });

      total += Number(inventory?.overridePrice ?? unit.basePrice);
    } else {
      const inventory = await tx.accommodationInventory.findFirst({
        where: {
          accommodationId: accommodation.id,
          date,
        },
      });

      total += Number(inventory?.overridePrice ?? accommodation.basePrice);
    }
  }

  return total * units;
}
