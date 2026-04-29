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
  const currentImages = await prisma.image.findMany({ where: { tourId: id } });

  const currentIds = currentImages.map((img) => img.id);

  //find images to delete
  const toDeleteIds = currentIds.filter(
    (id) => !input.existingImageIds.includes(id),
  );

  const toDeleteImages = currentImages.filter((img) =>
    toDeleteIds.includes(img.id),
  );

  //Delete from cloudinary
  await Promise.all(
    toDeleteImages.map((img) => cloudinary.uploader.destroy(img.publicId)),
  );

  //delete from the db
  await prisma.image.deleteMany({
    where: {
      id: {
        in: toDeleteIds,
      },
    },
  });

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
