import { prisma } from '../config/prisma';

export async function setFeaturedImage(tourId: string, imageId: string) {
  await prisma.image.updateMany({
    where: { tourId, type: 'TOUR', status: 'ACTIVE' },
    data: { isFeatured: false },
  });

  await prisma.image.update({
    where: { id: imageId },
    data: { isFeatured: true, type: 'TOUR', status: 'ACTIVE' },
  });

  return { message: 'Updated featured image' };
}
