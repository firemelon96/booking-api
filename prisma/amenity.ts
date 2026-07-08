import { prisma } from '../src/config/prisma';

export async function seedAmenity() {
  return prisma.amenity.createManyAndReturn({
    data: [
      {
        name: 'Bathroom',
        slug: 'bathroom',
      },
      {
        name: 'WiFi',
        slug: 'wifi',
      },
      {
        name: 'Parking',
        slug: 'parking',
      },
      {
        name: 'Kitchen',
        slug: 'kitchen',
      },
    ],
  });
}
