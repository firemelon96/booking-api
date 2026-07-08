import { prisma } from '../../config/prisma';

export async function findLocationOrFail(locationId: string) {
  const existing = await prisma.transferLocation.findUnique({
    where: {
      id: locationId,
    },
  });

  if (!existing) {
    throw new Error('Location not found');
  }

  return existing;
}
