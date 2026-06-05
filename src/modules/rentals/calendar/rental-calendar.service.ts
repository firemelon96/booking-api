import { eachDayOfInterval } from 'date-fns';
import { getMonthRange } from '../../../utils/helper';
import { findRentalItemByIdOrFail } from '../items/rental-item.query';
import { RentalCalendarInput } from './rental-calendar.type';

export async function calendarRentalService({
  itemId,
  month,
}: RentalCalendarInput) {
  await findRentalItemByIdOrFail(itemId);

  const { start, end } = getMonthRange(month);
  const days = eachDayOfInterval({ start, end });

  return;
}
