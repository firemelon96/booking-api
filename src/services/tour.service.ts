import { prisma } from '../config/prisma';
import { slugify } from '../utils/slugify';

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

export async function createTour(input: { name: string; slug?: string }) {
  const slug = input.slug ? input.slug : slugify(input.name);

  const exists = await prisma.tour.findUnique({ where: { slug } });

  if (exists) {
    throw new Error('Slug already exists');
  }

  return prisma.tour.create({
    data: {
      name: input.name,
      slug,
    },
  });
}

export async function updateTour(
  id: string,
  input: { name: string; slug?: string },
) {
  const existing = await prisma.tour.findUnique({ where: { id } });

  if (!existing) throw new Error('Tour not found');

  const nextSlug = input.slug ?? (input.name ? slugify(input.name) : undefined);

  if (nextSlug && nextSlug !== existing.slug) {
    const slugExists = await prisma.tour.findUnique({
      where: { slug: nextSlug },
    });
    if (slugExists) throw new Error('Slug already exists');
  }

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
