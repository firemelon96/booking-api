import { prisma } from '../src/config/prisma';
import {
  CapacityMode,
  PricingModel,
  PricingType,
  TourType,
} from '../src/generated/prisma/enums';

export async function seedShared(userId: string) {
  return prisma.$transaction(async (tx) => {
    const tour = await tx.tour.create({
      data: {
        name: 'Talaudyong shared day tour',
        slug: 'talaudyong-shared-day-tour',
        description:
          'Experience the beauty of Honda Bay with our exciting day tour, perfect for nature lovers and adventure seekers. Explore pristine beaches, vibrant coral reefs, and diverse marine life in this unforgettable island-hopping adventure.',
        durationDays: 1,
        capacityMode: CapacityMode.MIXED,
        location: 'Puerto Princesa, Palawan',
        type: TourType.DAY,
        ownerId: userId,
      },
    });

    await tx.tourInclusion.createMany({
      data: [
        { title: 'Light lunch', tourId: tour.id },
        { title: 'Water', tourId: tour.id },
        { title: 'Snorkel', tourId: tour.id },
      ],
    });

    await tx.tourExclusion.createMany({
      data: [
        { title: 'Entrance fee', tourId: tour.id },
        { title: 'Umbrella', tourId: tour.id },
        { title: 'Anything not mentioned', tourId: tour.id },
      ],
    });

    await tx.tourPricing.createMany({
      data: [
        {
          tourId: tour.id,
          pricingType: PricingType.PRIVATE,
          minGroupSize: 1,
          maxGroupSize: 12,
          price: 800,
          pricingModel: PricingModel.PER_PERSON,
        },
      ],
    });

    await tx.itinerary.create({
      data: {
        tourId: tour.id,
        days: {
          create: [
            {
              dayNumber: 1,
              title: 'Hotel Pickup and Travel to Talaudyong',
              items: {
                create: [
                  {
                    time: '8:00 AM - 9:00 AM',
                    title: 'Hotel Pickup',
                    description:
                      'Our friendly guide will pick you up from your hotel in Puerto Princesa.',
                    order: 1,
                  },
                  {
                    time: '9:00 AM - 10:30 AM',
                    title: 'Travel to Honda Bay',
                    description:
                      'Enjoy the scenic drive to Honda Bay, passing through beautiful landscapes and local villages.',
                    order: 2,
                  },
                ],
              },
            },
          ],
        },
      },
    });

    return tour;
  });
}
