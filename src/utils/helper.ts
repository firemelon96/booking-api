import {
  areIntervalsOverlapping,
  differenceInCalendarDays,
  eachDayOfInterval,
  startOfDay,
} from 'date-fns';
import { prisma } from '../config/prisma';
import { Prisma } from '../generated/prisma/client';

export function getDaysDiff(start: Date, end?: Date | null) {
  if (!end) return 1;

  return differenceInCalendarDays(startOfDay(end), startOfDay(start)) + 1;
}

// type DayInput = {
//   mode: 'day';
//   start: Date;
// };

// type RangeInput = {
//   mode: 'range';
//   start: Date;
//   end: Date;
// };

// export type IntervalInput = DayInput | RangeInput;

// export function normalizeInterval(input: IntervalInput) {
//   const s = startOfDay(input.start);

//   if (input.mode === 'day') {
//     return { start: s, end: s };
//   }

//   const e = startOfDay(input.end);
//   return { start: s, end: e };
// }

// export function buildInterval(start: Date, end?: Date | null) {
//   return end != null
//     ? normalizeInterval({ mode: 'range', start, end })
//     : normalizeInterval({ mode: 'day', start });
// }

export function normalizeInterval(start: Date, end?: Date | null) {
  const s = startOfDay(start);
  const e = startOfDay(end ?? start);
  return { start: s, end: e };
}

export function overlaps(
  a: { start: Date; end: Date },
  b: { start: Date; end: Date },
) {
  return areIntervalsOverlapping(a, b, { inclusive: true });
}

export async function getTourOrThrow(tourId: string) {
  const tour = await prisma.tour.findUnique({
    where: { id: tourId },
    select: {
      id: true,
      joinerCapacity: true,
      pricing: true,
      capacityMode: true,
    },
  });

  if (!tour) throw new Error('Tour not found');
  return tour;
}
