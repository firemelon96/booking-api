import { Prisma } from '../../../generated/prisma/client';

export async function releaseAccommodationInventory(
  tx: Prisma.TransactionClient,
  {
    accommodationId,
    dates,
    units,
  }: { accommodationId: string; dates: Date[]; units: number },
) {
  for (const date of dates) {
    await tx.accommodationInventory.updateMany({
      where: { accommodationId, date },
      data: {
        bookedUnits: {
          decrement: units,
        },
      },
    });
  }
}

export async function releaseUnitInventory(
  tx: Prisma.TransactionClient,
  { unitId, dates, units }: { unitId: string; dates: Date[]; units: number },
) {
  for (const date of dates) {
    await tx.accommodationUnitInventory.updateMany({
      where: {
        unitId,
        date,
      },
      data: {
        bookedUnits: {
          decrement: units,
        },
      },
    });
  }
}
