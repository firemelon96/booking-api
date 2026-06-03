import { prisma } from '../../config/prisma';

export async function findRentalBySlugOrFail(slug: string) {
  const rental = await prisma.rental.findUnique({ where: { slug } });

  if (!rental) {
    throw new Error('Rental not found');
  }

  return rental;
}

export async function findExistingRentalBySlug(slug: string) {
  const exist = await prisma.rental.findUnique({ where: { slug } });

  if (exist) {
    throw new Error('Rental with the same name already exists');
  }

  return exist;
}

export async function findRentalByIdOrFail(id: string) {
  const rental = await prisma.rental.findUnique({ where: { id } });

  if (!rental) {
    throw new Error('Rental not found');
  }

  return rental;
}
