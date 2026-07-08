import { Prisma } from '../../../generated/prisma/client';

export async function lockAccommodationInventory(
  tx: Prisma.TransactionClient,
  { accommodationId, dates }: { accommodationId: string; dates: Date[] },
) {
  for (const date of dates) {
    await tx.$queryRaw`
    SELECT id
    FROM "AccommodationInventory" 
    WHERE "accommodationId" = ${accommodationId} 
    AND "date" = ${date}
    FOR UPDATE
    `;
  }
}

export async function lockUnitInventory(
  tx: Prisma.TransactionClient,
  { unitId, dates }: { unitId: string; dates: Date[] },
) {
  for (const date of dates) {
    await tx.$queryRaw`
    SELECT id
    FROM "AccommodationUnitInventory" 
    WHERE "unitId" = ${unitId}
    AND "date" = ${date}
    FOR UPDATE
    `;
  }
}
