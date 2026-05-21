import { BookingAction, Prisma, Role } from '../../../generated/prisma/client';

export async function logBookingAction({
  tx,
  userId,
  role,
  newValue,
  previousValue,
  action,
}: {
  tx: Prisma.TransactionClient;
  userId?: string;
  role: Role;
  newValue: any;
  previousValue?: any;
  action: BookingAction;
}) {
  await tx.bookingAuditLog.create({
    data: {
      action,
      actorId: userId,
      actorType: role,
      newValue,
      previousValue: previousValue ?? null,
      timestamp: new Date(),
      bookingId: newValue.id,
    },
  });
}
