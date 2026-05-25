import { prisma } from '../../config/prisma';

export async function findAccommodationOrFail(accommodationId: string) {
  const accommodation = await prisma.accommodation.findUnique({
    where: { id: accommodationId },
  });

  if (!accommodation) {
    throw new Error('Accommodation not found');
  }

  return accommodation;
}

export async function findAccommodationBySlug(slug: string) {
  const accom = await prisma.accommodation.findUnique({
    where: {
      slug,
    },
  });

  if (!accom) {
    throw new Error('Accommodation not found');
  }

  return accom;
}
