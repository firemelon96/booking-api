import z from 'zod';
import cloudinary from '../config/cloudinary';
import { prisma } from '../config/prisma';
import groupBy from 'lodash.groupby';

import { slugify } from '../utils/slugify';
import { createFullTourSchema } from '../validators/tour.schema';
import { createTourPricingSchema } from '../validators/tourPricing.schema';

// function rangesOverlap(aMin: number, aMax: number, bMin: number, bMax: number) {
//   return Math.max(aMin, bMin) <= Math.min(aMax, bMax);
// }

// async function assertNoOverlap(data: {
//   tourId: string;
//   pricingType: PricingType;
//   minGroupSize: number;
//   maxGroupSize: number;
// }) {
//   const existing = await prisma.tourPricing.findMany({
//     where: {
//       tourId: data.tourId,
//       pricingType: data.pricingType,
//     },
//     select: { id: true, minGroupSize: true, maxGroupSize: true },
//   });

//   const conflict = existing.find((p) =>
//     rangesOverlap(
//       data.minGroupSize,
//       data.maxGroupSize,
//       p.minGroupSize,
//       p.maxGroupSize,
//     ),
//   );

//   if (conflict) {
//     throw new Error(
//       `Pricing range overlaps with the existing range ${conflict.minGroupSize}-${conflict.maxGroupSize}`,
//     );
//   }
// }

function validateNoOverlap(pricing: z.infer<typeof createTourPricingSchema>[]) {
  if (!pricing.length) {
    throw new Error('Pricing is required');
  }

  const grouped = groupBy(pricing, 'pricingType');

  for (const [type, ranges] of Object.entries(grouped)) {
    const sorted = [...ranges].sort((a, b) => a.minGroupSize - b.minGroupSize);

    if (sorted[0].minGroupSize !== 1) {
      throw new Error(`${type} pricing must start from group size 1`);
    }

    for (let i = 0; i < sorted.length; i++) {
      const current = sorted[i];

      //invalid range
      if (current.minGroupSize > current.maxGroupSize) {
        throw new Error(
          `${type}: Invalid range ${current.minGroupSize}=${current.maxGroupSize}`,
        );
      }

      //invalid price
      if (current.price <= 0) {
        throw new Error(`${type}: Price must be greater than 0`);
      }

      if (i === 0) continue;

      const prev = sorted[i - 1];

      //overlap
      if (current.minGroupSize <= prev.maxGroupSize) {
        throw new Error(
          `${type}: Overlap between ${prev.minGroupSize}-${prev.maxGroupSize} and ${current.minGroupSize}-${current.maxGroupSize}`,
        );
      }

      //gap
      if (current.minGroupSize !== prev.maxGroupSize + 1) {
        throw new Error(
          `${type}: Gap between ${prev.maxGroupSize} and ${current.minGroupSize}`,
        );
      }
    }
  }
}

export async function listTours() {
  return prisma.tour.findMany({
    orderBy: [{ name: 'asc' }],
    include: { pricing: true, images: true, itineraries: true },
  });
}

export async function getTourBySlug(slug: string) {
  const tour = await prisma.tour.findUnique({
    where: {
      slug,
    },
    include: { pricing: true },
  });

  if (!tour) throw new Error('Tour slug not found');
  return tour;
}

export async function getTourById(id: string) {
  const tour = await prisma.tour.findUnique({
    where: {
      id,
    },
    include: { pricing: true, images: true, itineraries: true },
  });

  if (!tour) throw new Error('Tour not founded');

  return tour;
}

// export async function createTour(input: {
//   name: string;
//   slug?: string;
//   imageIds: string[];
// }) {
//   const slug = input.slug ? input.slug : slugify(input.name);

//   const exists = await prisma.tour.findUnique({ where: { slug } });

//   if (exists) {
//     throw new Error('Slug already exists');
//   }

//   const tour = await prisma.tour.create({
//     data: {
//       name: input.name,
//       slug,
//     },
//   });

//   await prisma.image.updateMany({
//     where: {
//       id: { in: input.imageIds },
//     },
//     data: {
//       tourId: tour.id,
//       status: 'ACTIVE',
//       type: 'TOUR',
//     },
//   });

//   return tour;
// }

export async function updateTourImages(
  id: string,
  input: {
    existingImageIds: string[];
    newImageIds: string[];
  },
) {
  const tour = await prisma.tour.findUnique({ where: { id } });

  if (!tour) throw new Error('Tour not found');

  //get current images
  const currentImages = await prisma.image.findMany({ where: { tourId: id } });

  const currentIds = currentImages.map((img) => img.id);

  //find images to delete
  const toDeleteIds = currentIds.filter(
    (id) => !input.existingImageIds.includes(id),
  );

  const toDeleteImages = currentImages.filter((img) =>
    toDeleteIds.includes(img.id),
  );

  //Delete from cloudinary
  await Promise.all(
    toDeleteImages.map((img) => cloudinary.uploader.destroy(img.publicId)),
  );

  //delete from the db
  await prisma.image.deleteMany({
    where: {
      id: {
        in: toDeleteIds,
      },
    },
  });

  //update tours

  try {
    return prisma.image.updateMany({
      where: { id: { in: input.newImageIds } },
      data: {
        tourId: id,
        status: 'ACTIVE',
        type: 'TOUR',
      },
    });
  } catch (error) {
    await prisma.image.deleteMany({
      where: {
        id: { in: input.newImageIds },
        status: 'TEMP',
      },
    });
  }
}

export async function updateTour(
  id: string,
  input: Partial<{
    name: string;
    slug?: string;
    description: string;
    location: string;
    exclusions: string[];
    inclusions: string[];
    types: 'DAY' | 'PACKAGE';
  }>,
) {
  const existingTour = await prisma.tour.findUnique({ where: { id } });

  if (!existingTour) throw new Error('Tour not found');

  const nextSlug = input.slug ?? (input.name ? slugify(input.name) : undefined);

  if (nextSlug && nextSlug !== existingTour.slug) {
    const slugExists = await prisma.tour.findUnique({
      where: { slug: nextSlug },
    });
    if (slugExists) throw new Error('Slug already exists');
  }

  const data = Object.fromEntries(
    Object.entries({ ...input, slug: nextSlug }).filter(
      ([_, value]) => value !== undefined,
    ),
  );

  return prisma.tour.update({
    where: { id },
    data,
  });
}

export async function createFullTourService(
  data: z.infer<typeof createFullTourSchema>,
) {
  const {
    name,
    description,
    location,
    exclusions,
    inclusions,
    imageIds,
    itineraries,
    pricing,
  } = data;

  const slug = slugify(name);

  const exists = await prisma.tour.findUnique({ where: { slug } });

  if (exists) {
    throw new Error('Tour already exists');
  }

  validateNoOverlap(pricing);

  return prisma.$transaction(async (tx) => {
    //create tour
    const tour = await tx.tour.create({
      data: {
        name,
        slug,
        description,
        location,
        exclusions,
        inclusions,
      },
    });

    //create itineraries
    if (itineraries?.length) {
      await tx.itinerary.createMany({
        data: itineraries.map((item) => ({
          ...item,
          tourId: tour.id,
        })),
      });
    }

    //Create pricing
    await tx.tourPricing.createMany({
      data: pricing.map((p) => ({
        ...p,
        tourId: tour.id,
      })),
    });

    //assign imageIds
    if (imageIds.length) {
      await tx.image.updateMany({
        where: { id: { in: imageIds } },
        data: {
          tourId: tour.id,
          status: 'ACTIVE',
          type: 'TOUR',
        },
      });
    }

    return tour;
  });
}

export async function deleteTour(id: string) {
  const existing = await prisma.tour.findUnique({
    where: { id },
    include: { images: true },
  });

  if (!existing) throw new Error('Tour not found!');

  const deletePromises = existing.images.map((img) =>
    cloudinary.uploader.destroy(img.publicId),
  );

  await Promise.all(deletePromises);

  return prisma.tour.delete({ where: { id } });
}
