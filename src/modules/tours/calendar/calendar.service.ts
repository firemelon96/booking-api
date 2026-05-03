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
  const tour = await getTourIdBySlug(slug);

  const scheduleKey = getScheduleKey(scheduleId);
  const { start, end } = getMonthRange(month);

  const days = eachDayOfInterval({ start, end });

  return prisma.$transaction(async (tx) => {
    //capacity source of truth
    const capacities = await tx.tourDailyCapacity.findMany({
      where: {
        tourId: tour.id,
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
        tourId: tour.id,
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

      let status: 'AVAILABLE' | 'FULL' | 'CLOSED' | 'NO_CAPACITY';
      let capacity = 0;
      let booked = 0;
      let remainingSlots: number | null = null;

      if (availabilityRow?.isClosed) {
        status = 'CLOSED';
        return {
          date: day.toISOString().slice(0, 10),
          status,
          available: false,
          remainingSlots: null,
          capacity: 0,
          booked: 0,
        };
      }

      if (capacityRow) {
        capacity = capacityRow.capacity;
        booked = capacityRow.booked;
      } else {
        capacity = tour.joinerCapacity ?? 0;
        booked = 0;
      }

      if (capacity === 0) {
        status = 'NO_CAPACITY';
      } else if (booked >= capacity) {
        status = 'FULL';
        remainingSlots = 0;
      } else {
        status = 'AVAILABLE';
        remainingSlots = capacity - booked;
      }

      return {
        date: day.toISOString().slice(0, 10),
        status,
        available: status === 'AVAILABLE',
        remainingSlots: remainingSlots,
        capacity,
        booked,
      };
    });

    return {
      month,
      days: results,
    };
  });
}
