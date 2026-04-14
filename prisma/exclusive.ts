import { prisma } from '../src/config/prisma';
import { PricingModel, PricingType } from '../src/generated/prisma/enums';

export async function seedExclusive() {
  return prisma.$transaction(async (tx) => {
    const tour = await tx.tour.create({
      data: {
        name: 'Exclusive 3D2N Puerto Princesa Tour',
        slug: 'exclusive-3d2n-puerto-princesa-tour',
        description:
          'Experience the beauty of Honda Bay with our exciting day tour, perfect for nature lovers and adventure seekers. Explore pristine beaches, vibrant coral reefs, and diverse marine life in this unforgettable island-hopping adventure.',
        inclusions: [
          'Hotel pickup and drop-off',
          'Lunch',
          'Tour guide',
          'Entrance fees',
        ],
        durationDays: 3,
        capacityMode: 'EXCLUSIVE',
        exclusions: ['Personal expenses', 'Gratuities'],
        location: 'Puerto Princesa, Palawan',
        type: 'PACKAGE',
      },
    });

    await tx.tourPricing.createMany({
      data: [
        {
          tourId: tour.id,
          pricingType: PricingType.PRIVATE,
          minGroupSize: 1,
          maxGroupSize: 3,
          price: 3000,
          pricingModel: PricingModel.PER_GROUP,
        },
        {
          tourId: tour.id,
          pricingType: PricingType.PRIVATE,
          minGroupSize: 4,
          maxGroupSize: 7,
          price: 8000,
          pricingModel: PricingModel.PER_GROUP,
        },
        {
          tourId: tour.id,
          pricingType: PricingType.PRIVATE,
          minGroupSize: 8,
          maxGroupSize: 10,
          price: 11000,
          pricingModel: PricingModel.PER_GROUP,
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
            {
              dayNumber: 3,
              title: 'Side tour and free time',
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
            {
              dayNumber: 2,
              title: 'Island hopping',
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
