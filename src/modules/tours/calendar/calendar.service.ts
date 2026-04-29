import { eachDayOfInterval, startOfDay } from 'date-fns';
import { getMonthRange, getScheduleKey } from '../../../utils/helper';
import { CalendarQueryType } from './calendar.types';
import { prisma } from '../../../config/prisma';
import { getTourIdBySlug } from '../tour.query';

export async function calendarAvailability({
  slug,
  month,
  scheduleId,
}: CalendarQueryType & { slug: string }) {
  const tourId = await getTourIdBySlug(slug);

  const scheduleKey = getScheduleKey(scheduleId);
  const { start, end } = getMonthRange(month);

  const days = eachDayOfInterval({ start, end });

  return prisma.$transaction(async (tx) => {
    //capacity source of truth
    const capacities = await tx.tourDailyCapacity.findMany({
      where: {
        tourId,
        scheduleKey,
        date: { gte: start, lte: end },
      },
      select: {
        date: true,
        capacity: true,
        booked: true,
      },
    });

    //admin overrides
    const availability = await tx.tourAvailability.findMany({
      where: {
        tourId,
        date: { gte: start, lte: end },
      },
      select: {
        date: true,
        isClosed: true,
      },
    });

    //maps for 0(1)
    const capacityMap = new Map(
      capacities.map((c) => [startOfDay(c.date).getTime(), c]),
    );

    const availabilityMap = new Map(
      availability.map((a) => [startOfDay(a.date).getTime(), a]),
    );

    //build response
    const results = days.map((day) => {
      const key = startOfDay(day).getTime();

      const capacityRow = capacityMap.get(key);
      const availabilityRow = availabilityMap.get(key);

      let status: 'available' | 'full' | 'unavailable' = 'available';

      if (availabilityRow?.isClosed) {
        status = 'unavailable';
      } else if (capacityRow) {
        status =
          capacityRow.capacity - capacityRow.booked > 0 ? 'available' : 'full';
      } else {
        //no capacity row means not available for booking
        status = 'unavailable';
      }

      return {
        date: day.toISOString().slice(0, 10),
        status,
        available: status === 'available',
        availableSpots: capacityRow
          ? Math.max(capacityRow.capacity - capacityRow.booked, 0)
          : 0,
        capacity: capacityRow ? capacityRow.capacity : 0,
        booked: capacityRow ? capacityRow.booked : 0,
      };
    });

    return {
      month,
      days: results,
    };
  });
}
