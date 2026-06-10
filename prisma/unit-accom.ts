import { prisma } from '../src/config/prisma';
import { AccommodationType } from '../src/generated/prisma/enums';

export async function seedUnitAccom(userId: string, amenities: string[]) {
  return prisma.$transaction(async (tx) => {
    const accoms = await tx.accommodation.create({
      data: {
        name: 'CK Hotel',
        slug: 'ck-hotel',
        description: 'This is the first hotel in puerto',
        type: AccommodationType.HOTEL,
        address: 'Puerto princesa',
        hasUnits: true,
        checkInTime: '12:00 PM',
        checkOutTime: '2:00 PM',
        ownerId: userId,
      },
      include: {
        units: true,
      },
    });

    const unit = await tx.accommodationUnit.create({
      data: {
        name: 'Deluxe room',
        slug: 'deluxe-room',
        description: 'Enjoy the deluxe room',
        maxAdult: 12,
        bedrooms: 4,
        basePrice: 3000,
        bathrooms: 2,
        quantity: 3,
        accommodationId: accoms.id,
      },
    });

    await tx.accommodationAmenity.createMany({
      data: amenities.map((amenityId) => ({
        accommodationId: accoms.id,
        amenityId,
      })),
    });

    await tx.accommodationUnitAmenity.createMany({
      data: amenities.map((amenityId) => ({
        unitId: unit.id,
        amenityId,
      })),
    });

    return accoms;
  });
}
