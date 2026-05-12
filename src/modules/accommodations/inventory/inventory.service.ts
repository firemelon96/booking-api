import { Prisma } from '../../../generated/prisma/client';

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
  }: { accommodationId: string; dates: Date[]; units: number },
) {
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
      throw new Error('Date is closed');
    }

    const remaining = row.availableUnits - row.bookedUnits;

    if (remaining < units) {
      throw new Error('Not enough inventory');
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
}

export async function reserveUnitInventory(
  tx: Prisma.TransactionClient,
  { unitId, dates, units }: { unitId: string; dates: Date[]; units: number },
) {
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
      throw new Error('Date is closed');
    }

    const remaining = row.availableUnits - row.bookedUnits;

    if (remaining < units) {
      throw new Error('Unit is fully booked');
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
