import { eachDayOfInterval, startOfDay } from 'date-fns';
import { getMonthRange } from '../../../utils/helper';
import { findTransferBySlugOrFail } from '../transfer.query';
import { TransferCalendarQuery } from './transfer-calendar.types';
import { prisma } from '../../../config/prisma';
import { stat } from 'node:fs';

export async function getTransferCalendarService(
  slug: string,
  { month, scheduleId }: TransferCalendarQuery,
) {
  const transfer = await findTransferBySlugOrFail(slug);

  const { start, end } = getMonthRange(month);

  const day = eachDayOfInterval({ start, end });

  if (transfer.hasSchedule && !scheduleId) {
    throw new Error('Schedule must be selected');
  }

  if (!transfer.hasSchedule && scheduleId) {
    throw new Error('Schedule not required');
  }

  return prisma.$transaction(async (tx) => {
    const inventories = await tx.transferInventory.findMany({
      where: {
        transferId: transfer.id,
        scheduleId,
        date: { gte: start, lte: end },
      },
      select: {
        date: true,
        availableSeats: true,
        bookedSeats: true,
        isClosed: true,
      },
    });

    const inventoryMap = new Map(inventories.map((i) => [i.date.getTime(), i]));

    return day.map((d) => {
      const key = startOfDay(d).getTime();
      const inventoryRow = inventoryMap.get(key);

      let status: 'AVAILABLE' | 'FULL' | 'CLOSED' | 'NO_INVENTORY';
      let availableSlots = 0;
      let bookedSlots = 0;
      let remainingSlots: number | null = null;

      if (inventoryRow) {
        if (inventoryRow.isClosed) {
          status = 'CLOSED';
        } else if (inventoryRow.bookedSeats >= inventoryRow.availableSeats) {
          status = 'FULL';
          availableSlots = inventoryRow.availableSeats;
          bookedSlots = inventoryRow.bookedSeats;
        } else {
          status = 'AVAILABLE';
          availableSlots = inventoryRow.availableSeats;
          bookedSlots = inventoryRow.bookedSeats;
          remainingSlots =
            inventoryRow.availableSeats - inventoryRow.bookedSeats;
        }
      } else {
        status = 'NO_INVENTORY';
      }

      return {
        date: d.toISOString().slice(0, 10),
        status,
        availableSlots,
        bookedSlots,
        remainingSlots,
      };
    });
  });
}
