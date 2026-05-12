import { prisma } from '../../config/prisma';
import { slugify } from '../../utils/slugify';
import { CreateAmenityInputType } from './amenity.type';

export async function fetchAmenities() {
  return prisma.amenity.findMany({
    orderBy: {
      createdAt: 'asc',
    },
  });
}

export async function createdAmenity({ name, icon }: CreateAmenityInputType) {
  const slug = slugify(name);

  const existing = await prisma.amenity.findFirst({
    where: {
      OR: [{ name }, { slug }],
    },
  });

  if (existing) {
    throw new Error('Amenity already exist');
  }

  return prisma.amenity.create({
    data: {
      name,
      slug,
      icon,
    },
  });
}
