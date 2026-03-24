import cloudinary from '../config/cloudinary';
import { prisma } from '../config/prisma';
import { Image } from '../generated/prisma/browser';

import { slugify } from '../utils/slugify';
import { ImageType } from '../validators/image.schema';

export async function listTours() {
  return prisma.tour.findMany({
    orderBy: [{ name: 'asc' }],
    include: { pricing: true },
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
  images: ImageType[];
}) {
  const slug = input.slug ? input.slug : slugify(input.name);

  const exists = await prisma.tour.findUnique({ where: { slug } });

  if (exists) {
    throw new Error('Slug already exists');
  }

  return prisma.tour.create({
    data: {
      name: input.name,
      slug,
      images: {
        create: input.images.map((img) => ({
          url: img.url,
          publicId: img.public_Id,
        })),
      },
    },
    include: { images: true },
  });
}

export async function updateTour(
  id: string,
  input: {
    name: string;
    slug?: string;
    images: ImageType[];
    existingImages: ImageType[];
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
  const current = await prisma.image.findMany({ where: { tourId: id } });

  const existingIds = input.existingImages.map((img) => img.id);

  //find images to delete
  const toDelete = current.filter((img) => !existingIds.includes(img.id));

  //Delete from cloudinary
  await Promise.all(
    toDelete.map((img) => cloudinary.uploader.destroy(img.publicId)),
  );

  //delete from the db
  await prisma.image.deleteMany({
    where: {
      id: {
        in: toDelete.map((img) => img.id),
      },
    },
  });

  //add the new images
  const newImages = input.images.map((img) => ({
    url: img.url,
    publicId: img.public_Id,
    tourId: id,
  }));

  await prisma.image.createMany({
    data: newImages,
  });

  //update tours
  return prisma.tour.update({
    where: { id },
    data: {
      name: input.name ?? undefined,
      slug: nextSlug ?? undefined,
    },
  });
}

export async function deleteTour(id: string) {
  const existing = await prisma.tour.findUnique({ where: { id } });

  if (!existing) throw new Error('Tour not found!');

  return prisma.tour.delete({ where: { id } });
}
