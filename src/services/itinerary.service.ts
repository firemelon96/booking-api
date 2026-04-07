import { prisma } from '../config/prisma';

export async function addItinerary(params: {
  tourId: string;
  title: string;
  activities: string[];
  destinations: string[];
}) {
  const tour = await prisma.tour.findUnique({ where: { id: params.tourId } });

  if (!tour) {
    throw new Error('Tour not found');
  }

  const existing = await prisma.itinerary.findFirst({
    where: {
      tourId: params.tourId,
      title: params.title,
    },
  });

  if (existing) {
    throw new Error('Itinerary with this title already exists for this tour');
  }

  return prisma.itinerary.create({
    data: {
      tourId: params.tourId,
      activities: params.activities,
      destinations: params.destinations,
      title: params.title,
    },
  });
}
