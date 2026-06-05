import { prisma } from '../../config/prisma';
import { slugify } from '../../utils/slugify';
import {
  throwExistingRentalBySlug,
  findRentalByIdOrFail,
  findRentalBySlugOrFail,
} from './rental.query';
import { CreateRentalBody, RentalQuery, UpdateRentalBody } from './rental.type';

export async function getAllRentalsService({
  limit,
  page,
  search,
  sort = 'createdAt:desc',
  type,
}: RentalQuery) {
  const safePage = Math.max(1, page || 1);
  const safeLimit = Math.max(1, limit || 20);
  const skip = (safePage - 1) * safeLimit;

  const [sortField, sortOrder] = sort.split(':');

  const orderBy = {
    [sortField || 'createdAt']: sortOrder === 'asc' ? 'asc' : 'desc',
  };

  const where: any = {};

  if (type) {
    where.type = type;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      {
        rentalItems: {
          some: { name: { contains: search, mode: 'insensitive' } },
        },
      },
    ];
  }

  const [data, total] = await prisma.$transaction([
    prisma.rental.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy,
      include: {
        amenities: {
          select: {
            amenity: {
              select: {
                slug: true,
              },
            },
          },
        },
        rentalItems: {
          include: {
            pricing: true,
          },
        },
      },
    }),
    prisma.rental.count({ where }),
  ]);

  return {
    data: data.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      type: r.type,
      amenities: r.amenities.map((a) => a.amenity.slug),
      items: r.rentalItems.map((i) => ({
        name: i.name,
        description: i.description,
        itemCode: i.itemCode,
        quantity: i.quantity,
        pricing: i.pricing.map((p) => ({
          price: p.price,
          pricingType: p.pricingType,
        })),
      })),
    })),
    meta: {
      total,
      page: safePage,
      limit: safeLimit,
    },
  };
}

export async function getRentalDetailService(slug: string) {
  await findRentalBySlugOrFail(slug);

  const rental = await prisma.rental.findUnique({
    where: { slug },
    include: {
      amenities: {
        select: {
          amenity: {
            select: {
              slug: true,
            },
          },
        },
      },
      rentalItems: {
        include: {
          pricing: true,
        },
      },
    },
  });

  return {
    id: rental?.id,
    name: rental?.name,
    slug: rental?.slug,
    description: rental?.description,
    type: rental?.type,
    amenities: rental?.amenities.map((a) => a.amenity.slug),
    items: rental?.rentalItems.map((i) => ({
      name: i.name,
      description: i.description,
      itemCode: i.itemCode,
      quantity: i.quantity,
      pricing: i.pricing.map((p) => ({
        price: p.price,
        pricingType: p.pricingType,
      })),
    })),
  };
}

export async function createRentalService(
  userId: string,
  { items, name, type, amenityIds, description, imageIds }: CreateRentalBody,
) {
  const slug = slugify(name);

  await throwExistingRentalBySlug(slug);

  return prisma.$transaction(async (tx) => {
    const rental = await tx.rental.create({
      data: {
        name,
        description,
        type,
        slug,
        ownerId: userId,
      },
    });

    if (amenityIds && amenityIds.length > 0) {
      await tx.rentalAmenity.createMany({
        data: amenityIds.map((amenityId) => ({
          rentalId: rental.id,
          amenityId,
        })),
      });
    }

    //attach image
    if (imageIds && imageIds.length > 0) {
      await tx.image.updateMany({
        where: { id: { in: imageIds } },
        data: {
          rentalId: rental.id,
          status: 'ACTIVE',
          type: 'RENTALS',
        },
      });
    }

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

    return rental;
  });
}

export async function updateRentalService(
  rentalId: string,
  { amenityIds, imageIds, ...rentalData }: UpdateRentalBody,
) {
  await findRentalByIdOrFail(rentalId);

  const slug = rentalData.name ? slugify(rentalData.name) : undefined;

  if (slug) {
    await throwExistingRentalBySlug(slug);
  }

  return prisma.$transaction(async (tx) => {
    const updatedRental = await tx.rental.update({
      where: { id: rentalId },
      data: {
        ...rentalData,
        slug,
      },
    });

    if (amenityIds) {
      await tx.rentalAmenity.deleteMany({ where: { rentalId } });

      if (amenityIds.length > 0) {
        await tx.rentalAmenity.createMany({
          data: amenityIds.map((amenityId) => ({
            rentalId,
            amenityId,
          })),
        });
      }
    }

    return updatedRental;
  });
}

export async function removeRentalService(rentalId: string) {
  await findRentalByIdOrFail(rentalId);

  return prisma.$transaction(async (tx) => {
    await tx.rentalAmenity.deleteMany({ where: { rentalId } });

    await tx.rental.delete({ where: { id: rentalId } });
  });
}
