import {
  differenceInCalendarDays,
  eachDayOfInterval,
  startOfDay,
  subDays,
} from 'date-fns';

export function getStayDates({
  checkIn,
  checkOut,
}: {
  checkIn: Date;
  checkOut: Date;
}) {
  return eachDayOfInterval({
    start: startOfDay(checkIn),

    // checkout date is NOT occupied
    end: subDays(startOfDay(checkOut), 1),
  });
}

export function getNightCount({
  checkIn,
  checkOut,
}: {
  checkIn: Date;
  checkOut: Date;
}) {
  return differenceInCalendarDays(startOfDay(checkOut), startOfDay(checkIn));
}
