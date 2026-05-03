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
}: AdminWarningType & { tx: Prisma.TransactionClient }) {
  return tx.adminWarningLog.create({
    data: { actionType, actorId, message, metadata, tourId, bookingId },
  });
}
