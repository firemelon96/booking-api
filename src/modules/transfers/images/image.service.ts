import { Prisma } from '../../../generated/prisma/client';

export async function assignTransferImages(
  tx: Prisma.TransactionClient,
  transferId: string,
  imageIds: string[],
) {
  if (imageIds.length) {
    await tx.image.updateMany({
      where: { id: { in: imageIds } },
      data: {
        transferId,
        status: 'ACTIVE',
        type: 'TRANSFER',
      },
    });
  }
}
