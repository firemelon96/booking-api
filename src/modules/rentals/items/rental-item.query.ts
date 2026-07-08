import { prisma } from '../../../config/prisma';

export async function findRentalItemByIdOrFail(id: string) {
  const rentalItem = await prisma.rentalItem.findUnique({
    where: { id },
    include: { pricing: true },
  });

  if (!rentalItem) {
    throw new Error('Rental item not found');
  }

  return rentalItem;
}
