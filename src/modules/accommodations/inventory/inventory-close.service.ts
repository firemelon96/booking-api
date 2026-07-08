import { eachDayOfInterval } from 'date-fns';
import { findAccommodationOrFail } from '../accommodation.query';
import { CloseInventoryInput } from './inventory.type';
import { normalizeInterval } from '../../../utils/helper';
import { prisma } from '../../../config/prisma';
import {
  ensureAccommodationInventoryRows,
  ensureUnitInventoryRows,
} from './inventory.service';
import { findUnitOrFail } from '../unit/units.query';

export async function closeInventoryService(
  accommodationId: string,
  { endDate, startDate, unitId }: CloseInventoryInput,
) {
  const accommodation = await findAccommodationOrFail(accommodationId);

  if (accommodation.hasUnits && !unitId) {
    throw new Error('Requires unit');
  }

  if (!accommodation.hasUnits && unitId) {
    throw new Error('Accommodation does not have unit');
  }

  const interval = normalizeInterval(startDate, endDate);
  const dates = eachDayOfInterval(interval);

  return prisma.$transaction(async (tx) => {
    if (unitId) {
      await ensureUnitInventoryRows(tx, { unitId, dates, quantity: 0 });

      await tx.accommodationUnitInventory.updateMany({
        where: {
          unitId,
          date: {
            gte: interval.start,
            lte: interval.end,
          },
        },
        data: {
          isClosed: true,
        },
      });
    } else {
      await ensureAccommodationInventoryRows(tx, { accommodationId, dates });

      await tx.accommodationInventory.updateMany({
        where: {
          accommodationId,
          date: {
            gte: interval.start,
            lte: interval.end,
          },
        },
        data: {
          isClosed: true,
        },
      });
    }

    return { success: true, blockDates: dates.length };
  });
}

export async function openInventoryService(
  accommodationId: string,
  { endDate, startDate, unitId }: CloseInventoryInput,
) {
  const accommodation = await findAccommodationOrFail(accommodationId);

  if (accommodation.hasUnits && !unitId) {
    throw new Error('Requires unit');
  }

  if (!accommodation.hasUnits && unitId) {
    throw new Error('Accommodation does not have unit');
  }

  const interval = normalizeInterval(startDate, endDate);
  const dates = eachDayOfInterval(interval);

  return prisma.$transaction(async (tx) => {
    if (unitId) {
      const unit = await findUnitOrFail(unitId);

      await ensureUnitInventoryRows(tx, {
        unitId,
        dates,
        quantity: unit.quantity,
      });

      await tx.accommodationUnitInventory.updateMany({
        where: {
          unitId,
          date: {
            gte: interval.start,
            lte: interval.end,
          },
        },
        data: {
          isClosed: false,
        },
      });
    } else {
      await ensureAccommodationInventoryRows(tx, { accommodationId, dates });

      await tx.accommodationInventory.updateMany({
        where: {
          accommodationId,
          date: {
            gte: interval.start,
            lte: interval.end,
          },
        },
        data: {
          isClosed: false,
        },
      });
    }

    return { success: true };
  });
}
