import { areIntervalsOverlapping, startOfDay } from 'date-fns';

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
