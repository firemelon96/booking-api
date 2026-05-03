import { prisma } from '../../../config/prisma';
import { Prisma } from '../../../generated/prisma/client';
import { findTourOrFail } from '../tour.query';
import { validateItineraryRules } from './itinerary.rule';
import { ItineraryType } from './itinerary.type';

export async function createItinerary(
  tx: Prisma.TransactionClient,
  tourId: string,
  itinerary: ItineraryType,
) {
  return tx.itinerary.create({
    data: {
      tourId,
      days: {
        create: itinerary.map((day) => ({
          dayNumber: day.dayNumber,
          title: day.title,
          items: {
            create: day.items.map((item, index) => ({
              ...item,
              order: index,
            })),
          },
        })),
      },
    },
  });
}

export async function modifyItinerary(
  tourId: string,
  itinerary: ItineraryType,
) {
  const tour = await findTourOrFail(tourId);

  validateItineraryRules(tour.type, itinerary, tour.durationDays!);

  return prisma.$transaction(async (tx) => {
    await tx.itinerary.deleteMany({ where: { tourId } });

    return tx.itinerary.create({
      data: {
        tourId,
        days: {
          create: itinerary.map((day) => ({
            dayNumber: day.dayNumber,
            title: day.title,
            items: {
              create: day.items.map((item, index) => ({
                ...item,
                order: index,
              })),
            },
          })),
        },
      },
    });
  });
}
