import { prisma } from '../../../config/prisma';
import { Prisma } from '../../../generated/prisma/client';
import { findTransferOrThrow } from '../transfer.query';
import { TransferScheduleInput } from './schedule.type';

export async function addSchedules(
  tx: Prisma.TransactionClient,
  transferId: string,
  schedules: TransferScheduleInput[],
) {
  await tx.transferSchedule.createMany({
    data: schedules.map((s) => ({
      ...s,
      transferId,
    })),
  });
}

export async function modifySchedules(
  transferId: string,
  schedules: TransferScheduleInput[],
) {
  const transfer = await findTransferOrThrow(transferId);

  return prisma.$transaction(async (tx) => {
    await tx.transferSchedule.deleteMany({
      where: {
        transferId: transfer.id,
      },
    });

    await tx.transferSchedule.createMany({
      data: schedules.map((s) => ({
        ...s,
        transferId,
      })),
    });

    return { success: true, message: 'Updated schedules' };
  });
}
