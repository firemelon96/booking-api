import { Prisma } from '../../generated/prisma/client';
import { AdminWarningType } from './admin-warning.type';

export async function logAdminWarning({
  tx,
  actionType,
  actorId,
  message,
  metadata,
  tourId,
  bookingId,
  unitId,
  accommodationId,
  transferId,
  rentalId,
}: AdminWarningType & { tx: Prisma.TransactionClient }) {
  return tx.adminWarningLog.create({
    data: {
      actionType,
      unitId,
      accommodationId,
      actorId,
      message,
      metadata,
      tourId,
      bookingId,
      transferId,
      rentalId,
    },
  });
}
