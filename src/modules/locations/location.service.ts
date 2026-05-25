import { prisma } from '../../config/prisma';
import {
  AddLocationInput,
  LocationQueryInput,
  UpdateLocationInput,
} from './location.type';

export async function addLocationService(data: AddLocationInput) {
  //check
  //return creation of location
}

export async function updateLocationService(
  transferId: string,
  data: UpdateLocationInput,
) {
  //check
  //return creation of location
}

export async function removeLocationService(locationId: string) {
  //remove using the id
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

  //    const [data, total] = await prisma.$transaction([
  //     prisma.location.findMany({
  //       where,
  //       skip,
  //       take: safeLimit,
  //       orderBy,
  //       include: {
  //         _count: {
  //           select: {
  //             likes: true,
  //           },
  //         },
  //         pricing: {
  //           select: {
  //             price: true,
  //             pricingModel: true,
  //           },
  //         },
  //       },
  //     }),
  //     prisma.location.count({ where }),
  //   ]);

  //   return {
  //     data: data.map((t) => ({
  //       id: t.id,
  //       tourName: t.name,
  //       slug: t.slug,
  //       location: t.location,
  //       duration: t.durationDays,
  //       mode: t.capacityMode,
  //       tourType: t.type,
  //       startsAt: `${t.pricing[0].price} ${t.pricing[0].pricingModel}`,
  //       numberOfLikes: t._count,
  //     })),
  //     meta: {
  //       total,
  //       page: safePage,
  //       pageSize: safeLimit,
  //       pageCount: Math.ceil(total / safeLimit),
  //     },
  //   };
}
