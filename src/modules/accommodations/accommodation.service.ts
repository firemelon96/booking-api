import { prisma } from '../../config/prisma';
import { slugify } from '../../utils/slugify';
import { findAccommodationOrFail } from './accommodation.query';
import {
  AccommodationQueryInput,
  CreateAccommodationInput,
  UpdateAccommodationPartialInput,
} from './accommodation.type';

export async function createdAccommodation(
  ownerId: string,
  data: CreateAccommodationInput,
) {
  const slug = slugify(data.name);

  const existing = await prisma.accommodation.findUnique({
    where: {
      slug,
    },
  });

  if (existing) {
    throw new Error('Accommodation already exist');
  }

  const { amenityIds = [], ...accommodationData } = data;

  return prisma.$transaction(async (tx) => {
    const accommodation = await tx.accommodation.create({
      data: {
        ...accommodationData,
        slug,
        ownerId,
      },
    });

    if (amenityIds.length > 0) {
      await tx.accommodationAmenity.createMany({
        data: amenityIds.map((amenityId) => ({
          accommodationId: accommodation.id,
          amenityId,
        })),
        skipDuplicates: true,
      });
    }

    return accommodation;
  });
}

export async function listAccommodation({
  page = 1,
  limit = 20,
  sort = 'createdAt:desc',
  search,
  accommodationType,
}: AccommodationQueryInput) {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(30, limit);
  const skip = (safePage - 1) * safeLimit;

  const [sortField, sortOrder] = sort.split(':');

  const orderBy = {
    [sortField || 'createdAt']: sortOrder === 'asc' ? 'asc' : 'desc',
  };

  const where: any = {};

  if (accommodationType) {
    where.type = accommodationType;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await prisma.$transaction([
    prisma.accommodation.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy,
      include: {
        units: {
          select: { name: true, id: true },
        },
        amenities: {
          select: {
            amenity: {
              select: {
                slug: true,
              },
            },
          },
        },
      },
    }),
    prisma.accommodation.count({ where }),
  ]);

  return {
    data: data.map((a) => ({
      id: a.id,
      accommodationName: a.name,
      description: a.description,
      type: a.type,
      address: a.address,
      checkIn: a.checkInTime,
      checkOut: a.checkOutTime,
      hasUnit: a.hasUnits,
      units: a.units.map((u) => ({ id: u.id, name: u.name })),
      amenities: a.amenities,
    })),

    meta: {
      total,
      page: safePage,
      pageSize: safeLimit,
      pageCount: Math.ceil(total / safeLimit),
    },
  };
}

export async function updatedAccommodation(
  accommodationId: string,
  data: UpdateAccommodationPartialInput,
) {
  await findAccommodationOrFail(accommodationId);

  const { amenityIds = [], ...accommodationData } = data;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.accommodation.update({
      where: {
        id: accommodationId,
      },
      data: accommodationData,
    });

    if (amenityIds) {
      await tx.accommodationAmenity.deleteMany({
        where: { accommodationId },
      });

      if (amenityIds.length > 0) {
        await tx.accommodationAmenity.createMany({
          data: amenityIds.map((amenityId) => ({
            accommodationId,
            amenityId,
          })),
          skipDuplicates: true,
        });
      }
    }

    return updated;
  });
}

export async function removedAccommodation(accommodationId: string) {
  await findAccommodationOrFail(accommodationId);

  return prisma.accommodation.delete({
    where: { id: accommodationId },
  });
}
