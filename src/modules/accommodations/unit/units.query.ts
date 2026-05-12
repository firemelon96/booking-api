import { prisma } from '../../../config/prisma';

export async function findUnitOrFail(unitId: string) {
  const unitExist = await prisma.accommodationUnit.findUnique({
    where: { id: unitId },
  });

  if (!unitExist) {
    throw new Error('Unit does not exist');
  }

  return unitExist;
}
