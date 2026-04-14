import { prisma } from '../src/config/prisma';
import { PricingModel, PricingType } from '../src/generated/prisma/enums';

export async function seedShared() {
  return prisma.$transaction(async (tx) => {
    const tour = await tx.tour.create({
      data: {
        name: 'Shared mountain tour',
        slug: 'shared-mountain-tour',
        description:
          'Experience the beauty of Honda Bay with our exciting day tour, perfect for nature lovers and adventure seekers. Explore pristine beaches, vibrant coral reefs, and diverse marine life in this unforgettable island-hopping adventure.',
        inclusions: [
          'Hotel pickup and drop-off',
          'Lunch',
          'Tour guide',
          'Entrance fees',
        ],
        durationDays: 1,
        capacityMode: 'SHARED',
        exclusions: ['Personal expenses', 'Gratuities'],
        location: 'Puerto Princesa, Palawan',
        type: 'DAY',
      },
    });

    await tx.tourPricing.create({
      data: {
        tourId: tour.id,
        pricingType: PricingType.JOINER,
        minGroupSize: 1,
        maxGroupSize: 12,
        price: 3000,
        pricingModel: PricingModel.PER_PERSON,
      },
    });

    await tx.tourScheduleOption.createMany({
      data: [
        {
          label: 'Morning',
          tourId: tour.id,
          startTIme: '8:00 AM',
        },
        {
          label: 'Afternoon',
          tourId: tour.id,
          startTIme: '1:00 PM',
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
              title: 'Hotel Pickup and Travel to Honda Bay',
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
