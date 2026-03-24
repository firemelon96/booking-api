import { prisma } from '../config/prisma';

export async function setFeaturedImage(tourId: string, imageId: string) {
  await prisma.image.updateMany({
    where: { tourId },
    data: { isFeatured: false },
  });

  await prisma.image.update({
    where: { id: imageId },
    data: { isFeatured: true },
  });

  return { message: 'Updated featured image' };
}
