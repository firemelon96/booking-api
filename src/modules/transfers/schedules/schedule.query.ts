import { prisma } from '../../../config/prisma';

export async function validateTransferSchedule(
  transferId: string,
  scheduleId: string,
) {
  const schedule = await prisma.transferSchedule.findFirst({
    where: {
      id: scheduleId,
      transferId,
    },
    select: {
      id: true,
      maxPassengers: true,
    },
  });

  if (!schedule) {
    throw new Error('Invalid schedule selected');
  }

  return {
    scheduleId: schedule.id,
    maxPassengers: schedule.maxPassengers,
  };
}
