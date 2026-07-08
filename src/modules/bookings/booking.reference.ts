import { format } from 'date-fns';

function randomString(length = 4) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join('');
}

export function generateBookingReference() {
  const date = format(new Date(), 'yyyyMMdd');

  return `BK-${date}-${randomString(4)}`;
}
