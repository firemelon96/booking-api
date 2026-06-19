// import { prisma } from '../../../config/prisma';
// import { findRentalItemByIdOrFail } from '../items/rental-item.query';
// import { ensureRentalInventory } from './rental-inventory.service';

// export async function closeRentalInventory() {}

// export async function openRentalInventory(
//   rentalItemId: string,
//   { dates }: { dates: Date[] },
// ) {
//   const item = await findRentalItemByIdOrFail(rentalItemId);

//   return prisma.$transaction(async (tx) => {
//     await ensureRentalInventory(tx, { itemId: item.id, dates, quantity: 1 });
//   });
// }
