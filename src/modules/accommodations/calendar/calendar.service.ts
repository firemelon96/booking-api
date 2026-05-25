import { eachDayOfInterval, startOfDay } from 'date-fns';
import { prisma } from '../../../config/prisma';
import { getMonthRange } from '../../../utils/helper';
import { CalendarInput } from './calendar.type';
import {
  findAccommodationBySlug,
  findAccommodationOrFail,
} from '../accommodation.query';

export async function calendarAccommodationService(
  slug: string,
  { month, accommodationId, unitId }: CalendarInput,
) {
  await findAccommodationBySlug(slug);

  const { start, end } = getMonthRange(month);
  const days = eachDayOfInterval({ start, end });

  return prisma.$transaction(async (tx) => {
    let results;

    if (unitId) {
      const unit = await tx.accommodationUnit.findUnique({
        where: {
          accommodationId_slug: {
            accommodationId,
            slug,
          },
        },
      });

      if (!unit) {
        throw new Error('Unit not found');
      }

      const unitInventories = await tx.accommodationUnitInventory.findMany({
        where: {
          unitId,
          date: { gte: start, lte: end },
        },
        select: {
          date: true,
          availableUnits: true,
          bookedUnits: true,
          isClosed: true,
        },
      });

      const unitMap = new Map(
        unitInventories.map((u) => [startOfDay(u.date).getTime(), u]),
      );

      results = days.map((day) => {
        const key = startOfDay(day).getTime();
        const unitRow = unitMap.get(key);

        let status: 'AVAILABLE' | 'FULL' | 'CLOSED' | 'NO_INVENTORY';
        let availableUnits = 0;
        let bookedUnits = 0;
        let remainingSlots: number | null = null;

        if (unitRow?.isClosed) {
          status = 'CLOSED';
          return {
            date: day.toISOString().slice(0, 10),
            status,
            available: false,
            remainingSlots: null,
            availableUnits: 0,
            bookedUnits: 0,
          };
        }

        if (unitRow) {
          availableUnits = unitRow.availableUnits;
          bookedUnits = unitRow.bookedUnits;
        } else {
          availableUnits = 0;
          bookedUnits = 0;
        }

        if (availableUnits === 0) {
          status = 'NO_INVENTORY';
        } else if (bookedUnits >= availableUnits) {
          status = 'FULL';
        } else {
          status = 'AVAILABLE';
          remainingSlots = availableUnits - bookedUnits;
        }

        return {
          date: day.toISOString().slice(0, 10),
          status,
          available: status === 'AVAILABLE',
          remainingSlots,
          availableUnits,
          bookedUnits,
        };
      });
    } else {
      const accommodationInventories = await tx.accommodationInventory.findMany(
        {
          where: {
            accommodationId,
            date: { gte: start, lte: end },
          },
          select: {
            date: true,
            availableUnits: true,
            bookedUnits: true,
            isClosed: true,
          },
        },
      );

      const accommodationMap = new Map(
        accommodationInventories.map((a) => [startOfDay(a.date).getTime(), a]),
      );

      results = days.map((day) => {
        const key = startOfDay(day).getTime();
        const accommodationRow = accommodationMap.get(key);

        let status: 'AVAILABLE' | 'FULL' | 'CLOSED' | 'NO_INVENTORY';
        let availableUnits = 0;
        let bookedUnits = 0;
        let remainingSlots: number | null = null;

        if (accommodationRow?.isClosed) {
          status = 'CLOSED';
          return {
            date: day.toISOString().slice(0, 10),
            status,
            available: false,
            remainingSlots: null,
            availableUnits: 0,
            bookedUnits: 0,
          };
        }

        if (accommodationRow) {
          availableUnits = accommodationRow.availableUnits;
          bookedUnits = accommodationRow.bookedUnits;
        } else {
          availableUnits = 0;
          bookedUnits = 0;
        }

        if (availableUnits === 0) {
          status = 'NO_INVENTORY';
        } else if (bookedUnits >= availableUnits) {
          status = 'FULL';
        } else {
          status = 'AVAILABLE';
          remainingSlots = availableUnits - bookedUnits;
        }

        return {
          date: day.toISOString().slice(0, 10),
          status,
          available: status === 'AVAILABLE',
          remainingSlots,
          availableUnits,
          bookedUnits,
        };
      });
    }

    return {
      month,
      days: results,
    };
  });
}
