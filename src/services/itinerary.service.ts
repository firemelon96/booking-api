import { prisma } from '../config/prisma';
import { getTourOrThrow } from '../utils/helper';
import { UpdateItineraryInput } from '../validators/itinerary.schema';

// export async function addItinerary(params: {
//   tourId: string;
//   days: {
//     dayNumber: number;
//     title: string;
//     items: {
//       time: string;
//       title: string;
//       description: string;
//       order: number;
//     }[];
//   }[];
// }) {
//   await getTourOrThrow(params.tourId);

//   return prisma.itinerary.create({
//     data: {
//       tourId: params.tourId,
//       days: {
//         create: params.days.map((day) => ({
//           dayNumber: day.dayNumber,
//           title: day.title,
//           items: {
//             create: day.items.map((item) => ({
//               time: item.time,
//             })),
//           },
//         })),
//       },
//     },
//   });
// }

export async function updateItinerary(
  tourId: string,
  itinerary: UpdateItineraryInput,
) {
  return prisma.$transaction(async (tx) => {
    const existingItinerary = await tx.itinerary.findUnique({
      where: { tourId },
      include: {
        days: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!existingItinerary) {
      throw new Error('Itinerary not found');
    }

    // Delete existing itinerary
    await tx.itineraryItem.deleteMany({
      where: {
        day: {
          itineraryId: existingItinerary.id,
        },
      },
    });

    await tx.itineraryDay.deleteMany({
      where: {
        itineraryId: existingItinerary.id,
      },
    });

    await tx.itinerary.update({
      where: {
        id: existingItinerary.id,
      },
      data: {
        days: {
          create: itinerary.days.map((day) => ({
            dayNumber: day.dayNumber,
            title: day.title,
            items: {
              create: day.items.map((item, index) => ({
                time: item.time,
                title: item.title,
                description: item.description,
                order: index,
              })),
            },
          })),
        },
      },
      include: {
        days: {
          orderBy: { dayNumber: 'asc' },
          include: {
            items: { orderBy: { order: 'asc' } },
          },
        },
      },
    });
  });
}
