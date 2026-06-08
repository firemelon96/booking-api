import { eachDayOfInterval, startOfDay } from 'date-fns';
import { getMonthRange } from '../../../utils/helper';
import { findRentalItemByIdOrFail } from '../items/rental-item.query';
import { RentalCalendarInput } from './rental-calendar.type';
import { prisma } from '../../../config/prisma';

export async function rentalItemAvailabilityService({
  itemId,
  month,
}: RentalCalendarInput) {
  const rentalItem = await findRentalItemByIdOrFail(itemId);

  const { start, end } = getMonthRange(month);
  const days = eachDayOfInterval({ start, end });

  return prisma.$transaction(async (tx) => {
    const rentalItemInventories = await tx.rentalInventory.findMany({
      where: {
        rentalItemId: rentalItem.id,
        date: { gte: start, lte: end },
      },
      select: {
        date: true,
        availableUnits: true,
        bookedUnits: true,
        isClosed: true,
      },
    });

    const itemMap = new Map(
      rentalItemInventories.map((r) => [startOfDay(r.date).getTime(), r]),
    );

    return days.map((day) => {
      const key = startOfDay(day).getTime();
      const inventoryRow = itemMap.get(key);

      let status: 'AVAILABLE' | 'FULL' | 'CLOSED' | 'NO_INVENTORY';
      let availableUnits = 0;
      let bookedUnits = 0;
      let remainingSlots: number | null = null;

      if (inventoryRow) {
        if (inventoryRow.isClosed) {
          status = 'CLOSED';
        } else if (inventoryRow.bookedUnits >= inventoryRow.availableUnits) {
          status = 'FULL';
          availableUnits = inventoryRow.availableUnits;
          bookedUnits = inventoryRow.bookedUnits;
        } else {
          status = 'AVAILABLE';
          availableUnits = inventoryRow.availableUnits;
          bookedUnits = inventoryRow.bookedUnits;
          remainingSlots =
            inventoryRow.availableUnits - inventoryRow.bookedUnits;
        }
      } else {
        status = 'NO_INVENTORY';
      }

      return {
        date: day.toISOString().slice(0, 10),
        status,
        availableUnits,
        bookedUnits,
        remainingSlots,
      };
    });
  });
}
