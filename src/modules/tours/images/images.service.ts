import cloudinary from '../../../config/cloudinary';
import { prisma } from '../../../config/prisma';
import { Prisma } from '../../../generated/prisma/client';
import { findTourOrFail } from '../tour.query';

export async function attachImages(
  tx: Prisma.TransactionClient,
  tourId: string,
  imageIds: string[],
) {
  if (imageIds.length) {
    await tx.image.updateMany({
      where: { id: { in: imageIds } },
      data: {
        tourId,
        status: 'ACTIVE',
        type: 'TOUR',
      },
    });
  }
}

export async function updateTourImages(
  id: string,
  input: {
    existingImageIds: string[];
    newImageIds: string[];
  },
) {
  await findTourOrFail(id);

  //get current images
  const currentImages = await prisma.image.findMany({
    where: { tourId: id },
    select: {
      id: true,
      publicId: true,
    },
  });

  const existingIds = new Set(input.existingImageIds);

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

  if (!input.newImageIds.length) {
    return { count: 0 };
  }

  //update tours
  return prisma.image.updateMany({
    where: { id: { in: input.newImageIds } },
    data: {
      tourId: id,
      status: 'ACTIVE',
      type: 'TOUR',
    },
  });
}
