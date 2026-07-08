import { prisma } from '../../../config/prisma';

export async function likedTransfer({
  transferId,
  userId,
}: {
  transferId: string;
  userId: string;
}) {
  return prisma.serviceLike.create({
    data: {
      userId,
      transferId,
      serviceType: 'TRANSFER',
    },
  });
}

export async function unlikeTransfer({
  transferId,
  userId,
}: {
  transferId: string;
  userId: string;
}) {
  return prisma.serviceLike.delete({
    where: {
      userId_serviceType: {
        userId,
        serviceType: 'TRANSFER',
      },
      transferId,
    },
  });
}
