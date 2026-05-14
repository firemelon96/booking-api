import { prisma } from '../../config/prisma';

export async function findTourBookingOrFail(bookingId: string) {
  const tourBooking = await prisma.tourBooking.findUnique({
    where: { bookingId },
    include: { tour: true },
  });

  if (!tourBooking) throw new Error('Tour booking not found');

  return tourBooking;
}

export async function findTourOrFail(tourId: string) {
  const tour = await prisma.tour.findUnique({
    where: { id: tourId },
    include: { schedules: true, images: true },
  });

  if (!tour) throw new Error('Tour not found');

  return tour;
}

export async function existingTourSlug(slug: string) {
  const exist = await prisma.tour.findUnique({ where: { slug } });

  if (exist) throw new Error('Tour already exist');

  return;
}

export async function getTourById(id: string) {
  const tour = await prisma.tour.findUnique({
    where: { id },
    include: {
      pricing: true,
      itinerary: {
        include: {
          days: {
            include: {
              items: true,
            },
          },
        },
      },
    },
  });

  if (!tour) throw new Error('Tour not found');

  return tour;
}

export async function getTourIdBySlug(slug: string) {
  const tour = await prisma.tour.findUnique({
    where: { slug },
    select: {
      id: true,
      joinerCapacity: true,
    },
  });

  if (!tour) throw new Error('Tour not found');

  return tour;
}
