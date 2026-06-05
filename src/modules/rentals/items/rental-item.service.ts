import { prisma } from '../../../config/prisma';
import { slugify } from '../../../utils/slugify';
import { findRentalByIdOrFail } from '../rental.query';
import { findRentalItemByIdOrFail } from './rental-item.query';
import { CreateRentalItemType, RentalItemIdParams } from './rental-item.type';

export async function createRentalItemService(
  rentalId: string,
  { itemCode, name, pricing, description, quantity }: CreateRentalItemType,
) {
  const rental = await findRentalByIdOrFail(rentalId);

  return prisma.rentalItem.create({
    data: {
      name,
      description,
      itemCode,
      quantity,
      rentalId: rental.id,
      pricing: {
        createMany: {
          data: pricing.map((p) => ({
            price: p.price,
            pricingType: p.pricingType,
          })),
        },
      },
    },
  });
}

export async function updateRentalItemService(
  { rentalId, itemId }: RentalItemIdParams,
  { itemCode, name, pricing, description, quantity }: CreateRentalItemType,
) {
  const rental = await findRentalByIdOrFail(rentalId);

  const rentalItem = await findRentalItemByIdOrFail(itemId);

  const slug = name ? slugify(name) : undefined;

  if (rentalItem.rentalId !== rental.id) {
    throw new Error('Rental item does not belong to the specified rental');
  }

  return prisma.$transaction(async (tx) => {
    const updatedRentalItem = await tx.rentalItem.update({
      where: { id: rentalItem.id },
      data: {
        name,
        description,
        itemCode,
        quantity,
        slug,
      },
    });

    if (pricing) {
      await tx.rentalPricing.deleteMany({
        where: { rentalItemId: rentalItem.id },
      });

      await tx.rentalPricing.createMany({
        data: pricing.map((p) => ({
          price: p.price,
          pricingType: p.pricingType,
          rentalItemId: rentalItem.id,
        })),
      });
    }

    return updatedRentalItem;
  });
}

export async function removeRentalItemService({
  rentalId,
  itemId,
}: RentalItemIdParams) {
  const rental = await findRentalByIdOrFail(rentalId);

  const rentalItem = await findRentalItemByIdOrFail(itemId);

  if (rentalItem.rentalId !== rental.id) {
    throw new Error('Rental item does not belong to the specified rental');
  }

  return prisma.$transaction(async (tx) => {
    await tx.rentalPricing.deleteMany({
      where: { rentalItemId: rentalItem.id },
    });

    await tx.rentalItem.delete({
      where: { id: rentalItem.id },
    });
  });
}

export async function createBulkRentalItemsService(
  rentalId: string,
  items: CreateRentalItemType[],
) {
  const rental = await findRentalByIdOrFail(rentalId);

  return prisma.$transaction(async (tx) => {
    for (const item of items) {
      const rentalItem = await tx.rentalItem.create({
        data: {
          name: item.name,
          description: item.description,
          itemCode: item.itemCode,
          quantity: item.quantity,
          rentalId: rental.id,
        },
      });

      if (item.pricing && item.pricing.length > 0) {
        await tx.rentalPricing.createMany({
          data: item.pricing.map((pricing) => ({
            rentalItemId: rentalItem.id,
            price: pricing.price,
            pricingType: pricing.pricingType,
          })),
        });
      }
    }
  });
}
