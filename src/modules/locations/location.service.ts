import { prisma } from '../../config/prisma';
import { findLocationOrFail } from './location.query';
import {
  AddLocationInput,
  LocationQueryInput,
  UpdateLocationInput,
} from './location.type';

export async function addLocationService(data: AddLocationInput) {
  const exist = await prisma.transferLocation.findFirst({
    where: { name: data.name },
  });

  if (exist) {
    throw new Error('Location already exist');
  }

  return prisma.transferLocation.create({
    data,
  });
}

export async function updateLocationService(
  locationId: string,
  data: UpdateLocationInput,
) {
  const location = await findLocationOrFail(locationId);

  return prisma.transferLocation.update({
    where: {
      id: location.id,
    },
    data: {
      ...data,
    },
  });
}

export async function removeLocationService(locationId: string) {
  await findLocationOrFail(locationId);

  return prisma.transferLocation.delete({ where: { id: locationId } });
}

export async function listLocationService({
  limit = 10,
  page = 1,
  search,
  sort = 'createdAt:desc',
  type,
}: LocationQueryInput) {
  const safePage = Math.max(page, 1);
  const safeLimit = Math.min(limit, 30);
  const skip = (safePage - 1) * safeLimit;

  const [sortField, sortOrder] = sort.split(':');

  const orderBy = {
    [sortField || 'createdAt']: sortOrder === 'asc' ? 'asc' : 'desc',
  };

  const where: any = {};

  if (type) where.type = type;

  if (search) {
    where.OR = [
      {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        address: {
          contains: search,
          mode: 'insensitive',
        },
      },
    ];
  }

  const [data, total] = await prisma.$transaction([
    prisma.transferLocation.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy,
    }),
    prisma.transferLocation.count({ where }),
  ]);

  return {
    data: data.map((l) => ({
      id: l.id,
      name: l.name,
      type: l.type,
      address: l.address,
    })),
    meta: {
      total,
      page: safePage,
      pageSize: safeLimit,
      pageCount: Math.ceil(total / safeLimit),
    },
  };
}
