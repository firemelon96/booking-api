import { prisma } from '../../../config/prisma';

export async function findCapacityOrFail({ id }: { id: string }) {
  const capacity = await prisma.tourDailyCapacity.findUnique({
    where: { id },
  });

  if (!capacity) {
    throw new Error('Capacity not found');
  }

  return capacity;
}
