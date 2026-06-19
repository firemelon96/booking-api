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

  const { start, end } = getMonthRange(month);

  const days = eachDayOfInterval({ start, end });

  if (tour.hasSchedule && !scheduleId) {
    throw new Error('Schedule must be selected');
  }

  if (!tour.hasSchedule && scheduleId) {
    throw new Error('Schedule not required');
  }

  return prisma.$transaction(async (tx) => {
    //capacity source of truth
    const capacities = await tx.tourDailyCapacity.findMany({
      where: {
        tourId: tour.id,
        scheduleId,
        date: { gte: start, lte: end },
      },
      select: {
        date: true,
        availableSlots: true,
        bookedSlots: true,
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
    return days.map((day) => {
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
          remainingSlots: null,
          capacity: 0,
          booked: 0,
        };
      }

      if (capacityRow) {
        if (capacityRow.bookedSlots >= capacityRow.availableSlots) {
          status = 'FULL';
          capacity = capacityRow.availableSlots;
          booked = capacityRow.bookedSlots;
        } else {
          status = 'AVAILABLE';
          capacity = capacityRow.availableSlots;
          booked = capacityRow.bookedSlots;
          remainingSlots = capacityRow.availableSlots - capacityRow.bookedSlots;
        }
      } else {
        status = 'NO_CAPACITY';
      }

      return {
        date: day.toISOString().slice(0, 10),
        status,
        remainingSlots: remainingSlots,
        capacity,
        booked,
      };
    });
  });
}
