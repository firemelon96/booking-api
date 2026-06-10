import { prisma } from '../src/config/prisma';
import { AccommodationType } from '../src/generated/prisma/enums';

export async function seedAccom(userId: string, amenities: string[]) {
  return prisma.$transaction(async (tx) => {
    const accoms = await tx.accommodation.create({
      data: {
        name: 'Clark kent homestay',
        slug: 'clark-kent-homestay',
        description: 'This is the first homestay in puerto',
        type: AccommodationType.HOMESTAY,
        address: 'Puerto princesa',
        hasUnits: false,
        isBookable: true,
        checkInTime: '12:00 PM',
        checkOutTime: '2:00 PM',
        basePrice: 2000,
        maxGuests: 12,
        ownerId: userId,
      },
    });

    await tx.accommodationAmenity.createMany({
      data: amenities.map((amenityId) => ({
        accommodationId: accoms.id,
        amenityId,
      })),
    });

    return accoms;
  });
}
