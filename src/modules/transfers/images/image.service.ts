import cloudinary from '../../../config/cloudinary';
import { prisma } from '../../../config/prisma';
import { Prisma } from '../../../generated/prisma/client';
import { findTransferOrThrow } from '../transfer.query';
import { SetFeaturedInput } from './image.type';

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

export async function updateTransferImages(
  transferId: string,
  {
    existingImageIds,
    newImageIds,
  }: {
    existingImageIds: string[];
    newImageIds: string[];
  },
) {
  await findTransferOrThrow(transferId);

  //get current images
  const currentImages = await prisma.image.findMany({
    where: { transferId },
    select: {
      id: true,
      publicId: true,
    },
  });

  const existingIds = new Set(existingImageIds);

  const imagesToDelete = currentImages.filter(
    (img) => !existingIds.has(img.id),
  );

  if (imagesToDelete.length) {
    //Delete from cloudinary
    await Promise.all(
      imagesToDelete.map((img) => cloudinary.uploader.destroy(img.publicId)),
    );

    //delete from the db
    await prisma.image.deleteMany({
      where: {
        id: {
          in: imagesToDelete.map((img) => img.id),
        },
      },
    });
  }

  if (!newImageIds.length) {
    return { count: 0 };
  }

  //update tours
  return prisma.image.updateMany({
    where: { id: { in: newImageIds } },
    data: {
      transferId,
      status: 'ACTIVE',
      type: 'TRANSFER',
    },
  });
}

export async function setFeaturedService({
  transferId,
  imageId,
}: SetFeaturedInput) {
  return prisma.$transaction(async (tx) => {
    await tx.image.updateMany({
      where: {
        transferId,
        isFeatured: true,
      },
      data: {
        isFeatured: false,
      },
    });

    await tx.image.update({
      where: {
        id: imageId,
        transferId,
      },
      data: {
        isFeatured: true,
      },
    });
  });
}
