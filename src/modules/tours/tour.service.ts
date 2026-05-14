import cloudinary from '../../config/cloudinary';
import { prisma } from '../../config/prisma';

import { slugify } from '../../utils/slugify';
import { validateBaseTourRules } from './tour.rules';
import { existingTourSlug, findTourOrFail } from './tour.query';
import { createPricing } from './pricing/pricing.service';
import { createItinerary } from './itinerary/itinerary.service';
import { CreateTourType, TourParams, UpdateTourType } from './tour.type';
import { attachImages } from './images/images.service';
import { validateItineraryRules } from './itinerary/itinerary.rule';
import { validatePricingRules } from './pricing/pricing.rule';

export async function listTours({
  page = 1,
  limit = 10,
  search,
  sort = 'createdAt:desc',
  capacityMode,
  duration,
  type,
}: TourParams) {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(30, limit);
  const skip = (safePage - 1) * safeLimit;

  const [sortField, sortOrder] = sort?.split(':');

  const orderBy = {
    [sortField || 'createdAt']: sortOrder === 'asc' ? 'asc' : 'desc',
  };

  const where: any = {};

  if (capacityMode) where.capacityMode = capacityMode;
  if (duration) where.duration = duration;
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
        location: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        slug: {
          contains: search,
          mode: 'insensitive',
        },
      },
    ];
  }

  const [data, total] = await prisma.$transaction([
    prisma.tour.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy,
      include: {
        _count: {
          select: {
            likes: true,
          },
        },
        pricing: {
          select: {
            price: true,
            pricingModel: true,
          },
        },
      },
    }),
    prisma.tour.count({ where }),
  ]);

  return {
    data: data.map((t) => ({
      id: t.id,
      tourName: t.name,
      slug: t.slug,
      location: t.location,
      duration: t.durationDays,
      mode: t.capacityMode,
      tourType: t.type,
      startsAt: `${t.pricing[0].price} ${t.pricing[0].pricingModel}`,
      numberOfLikes: t._count,
    })),
    meta: {
      total,
      page: safePage,
      pageSize: safeLimit,
      pageCount: Math.ceil(total / safeLimit),
    },
  };
}

export async function getTourBySlug(slug: string) {
  const tour = await prisma.tour.findUnique({
    where: {
      slug,
    },
    include: { pricing: true, itinerary: { include: { days: true } } },
  });

  if (!tour) throw new Error('Tour slug not found');

  return tour;
}

export async function createFullTour(data: CreateTourType) {
  validateItineraryRules(data.type, data.itinerary, data.durationDays!);
  validatePricingRules(data.capacityMode, data.pricing);

  const slug = slugify(data.name);

  await existingTourSlug(slug);

  return prisma.$transaction(async (tx) => {
    //create tour
    const tour = await tx.tour.create({
      data: {
        ownerId: data.ownerId,
        slug,
        description: data.description,
        location: data.location,
        name: data.name,
        durationDays: data.durationDays,
        exclusions: data.exclusions,
        inclusions: data.inclusions,
        capacityMode: data.capacityMode,
        type: data.type,
        joinerCapacity: data.joinerCapacity,
      },
    });

    //create itineraries
    await createItinerary(tx, tour.id, data.itinerary);
    //Create pricing
    await createPricing(tx, tour.id, data.pricing);
    //assign imageIds
    await attachImages(tx, tour.id, data.imageIds);

    return tour;
  });
}

export async function updateBaseTour(id: string, data: UpdateTourType) {
  const existing = await findTourOrFail(id);

  let slug = existing.slug;

  if (data.name && data.name !== existing.name) {
    slug = slugify(data.name);
    const slugExists = await prisma.tour.findUnique({
      where: { slug },
    });
    if (slugExists) throw new Error('Slug already exists');
  }

  const baseValidationInput = {
    type: data.type ?? existing.type,
    durationDays: data.durationDays ?? existing.durationDays ?? undefined,
    capacityMode: data.capacityMode ?? existing.capacityMode,
  };

  validateBaseTourRules(baseValidationInput);

  const updateData = Object.fromEntries(
    Object.entries({ ...data, slug }).filter(
      ([_, value]) => value !== undefined,
    ),
  );

  return prisma.tour.update({ where: { id }, data: updateData });
}

export async function deleteTour(id: string) {
  const existing = await findTourOrFail(id);

  const deletePromises = existing.images.map((img) =>
    cloudinary.uploader.destroy(img.publicId),
  );

  await Promise.all(deletePromises);

  return prisma.tour.delete({ where: { id } });
}
