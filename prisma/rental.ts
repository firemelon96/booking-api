import { prisma } from '../src/config/prisma';
import { RentalPricingType, RentalType } from '../src/generated/prisma/enums';

export async function seedRental(userId: string) {
  return prisma.$transaction(async (tx) => {
    const rental = await tx.rental.create({
      data: {
        name: 'Motorbike rental',
        slug: 'motorbike-rental',
        type: RentalType.MORTORBIKE,
        ownerId: userId,
      },
    });

    await tx.rentalItem.create({
      data: {
        rentalId: rental.id,
        name: 'TMX 150',
        itemCode: 'TMX',
        quantity: 2,
        pricing: {
          createMany: {
            data: [
              {
                pricingType: RentalPricingType.DAILY,
                price: 1000,
              },
              {
                pricingType: RentalPricingType.HOURLY,
                price: 400,
              },
              {
                pricingType: RentalPricingType.WEEKLY,
                price: 6000,
              },
            ],
          },
        },
      },
    });

    return rental;
  });
}
