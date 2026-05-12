import { prisma } from '../../../config/prisma';
import { slugify } from '../../../utils/slugify';
import { findAccommodationOrFail } from '../accommodation.query';
import { findUnitOrFail } from './units.query';
import { CreateUnitInput, UnitQueryInput } from './units.type';

export async function createdUnit(
  accommodationId: string,
  data: CreateUnitInput,
) {
  const accommodation = await findAccommodationOrFail(accommodationId);

  if (!accommodation.hasUnits) {
    throw new Error('This accommodation does not support unit');
  }

  const slug = slugify(data.name);

  const unitExist = await prisma.accommodationUnit.findUnique({
    where: {
      accommodationId_slug: {
        accommodationId,
        slug,
      },
    },
  });

  if (unitExist) {
    throw new Error('Unit already exist');
  }

  const { amenityIds = [], ...unitData } = data;

  return prisma.$transaction(async (tx) => {
    const unit = await tx.accommodationUnit.create({
      data: {
        ...unitData,
        accommodationId,
        slug,
      },
    });

    if (amenityIds.length > 0) {
      await tx.accommodationUnitAmenity.createMany({
        data: amenityIds.map((amenityId) => ({
          unitId: unit.id,
          amenityId,
        })),
        skipDuplicates: true,
      });
    }

    return unit;
  });
}

export async function updatedUnit(
  accommodationId: string,
  unitId: string,
  data: CreateUnitInput,
) {
  await findAccommodationOrFail(accommodationId);

  await findUnitOrFail(unitId);

  const { amenityIds = [], ...unitData } = data;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.accommodationUnit.update({
      where: { id: unitId },
      data: unitData,
    });

    if (amenityIds) {
      await tx.accommodationUnitAmenity.deleteMany({
        where: { unitId },
      });

      if (amenityIds.length > 0) {
        await tx.accommodationUnitAmenity.createMany({
          data: amenityIds.map((amenityId) => ({
            unitId,
            amenityId,
          })),
          skipDuplicates: true,
        });
      }
    }

    return updated;
  });
}

export async function listUnits({
  page = 1,
  limit = 30,
  search,
  sort = 'createdAt:desc',
  accommodationId,
}: UnitQueryInput) {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(10, limit);
  const skip = (safePage - 1) * safeLimit;

  const [sortField, sortOrder] = sort.split(':');

  const orderBy = {
    [sortField || 'createdAt']: sortOrder === 'asc' ? 'asc' : 'desc',
  };

  const where: any = {};

  if (accommodationId) {
    where.accommodationId = accommodationId;
  }

  if (search) {
    where.OR = [
      {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        description: {
          contains: search,
          mode: 'insensitive',
        },
      },
    ];
  }

  const [data, total] = await prisma.$transaction([
    prisma.accommodationUnit.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy,
    }),
    prisma.accommodationUnit.count({ where }),
  ]);

  return {
    data: data.map((u) => ({
      id: u.id,
      unitName: u.name,
      description: u.description,
      quantity: u.quantity,
      price: u.basePrice,
    })),
    meta: {
      total,
      page: safePage,
      pageSize: safeLimit,
      pageCount: Math.ceil(total / safeLimit),
    },
  };
}

export async function deleteUnit(accommodationId: string, unitId: string) {
  await findAccommodationOrFail(accommodationId);

  await findUnitOrFail(unitId);

  return prisma.accommodationUnit.delete({
    where: {
      id: unitId,
    },
  });
}
