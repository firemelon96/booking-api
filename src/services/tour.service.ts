import cloudinary from '../config/cloudinary';
import { prisma } from '../config/prisma';
import { Image } from '../generated/prisma/browser';

import { slugify } from '../utils/slugify';

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

  if (!tour) throw new Error('Tour not found');
  return tour;
}

export async function createTour(input: {
  name: string;
  slug?: string;
  imageIds: string[];
}) {
  const slug = input.slug ? input.slug : slugify(input.name);

  const exists = await prisma.tour.findUnique({ where: { slug } });

  if (exists) {
    throw new Error('Slug already exists');
  }

  const tour = await prisma.tour.create({
    data: {
      name: input.name,
      slug,
    },
  });

  await prisma.image.updateMany({
    where: {
      id: { in: input.imageIds },
    },
    data: {
      tourId: tour.id,
      status: 'ACTIVE',
      type: 'TOUR',
    },
  });

  return tour;
}

export async function updateTour(
  id: string,
  input: {
    name: string;
    slug?: string;
    existingImageIds: string[];
    newImageIds: string[];
  },
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

  //assign the new images
  await prisma.image.updateMany({
    where: { id: { in: input.newImageIds } },
    data: {
      tourId: id,
      status: 'ACTIVE',
      type: 'TOUR',
    },
  });

  //update tours

  try {
    return prisma.tour.update({
      where: { id },
      data: {
        name: input.name ?? undefined,
        slug: nextSlug ?? undefined,
      },
      include: { images: true },
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
