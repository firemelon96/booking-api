import bcrypt from 'bcrypt';
import { prisma } from '../src/config/prisma';
import { PricingType, Role, TourSchedule } from '../src/generated/prisma/enums';

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data (dev only)
  await prisma.booking.deleteMany();
  await prisma.tourPricing.deleteMany();
  await prisma.tour.deleteMany();
  await prisma.user.deleteMany();
  await prisma.itinerary.deleteMany();
  await prisma.tourScheduleOption.deleteMany();

  // Password hash
  const password = await bcrypt.hash('password123', 10);

  // Users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password,
      role: Role.ADMIN,
    },
  });

  const user = await prisma.user.create({
    data: {
      email: 'user@example.com',
      password,
      role: Role.USER,
    },
  });

  const dayTour = await prisma.tour.create({
    data: {
      name: 'Honda bay tour',
      slug: 'honda-bay-tour',
      description:
        'Experience the beauty of Honda Bay with our exciting day tour, perfect for nature lovers and adventure seekers. Explore pristine beaches, vibrant coral reefs, and diverse marine life in this unforgettable island-hopping adventure.',
      inclusions: [
        'Hotel pickup and drop-off',
        'Lunch',
        'Tour guide',
        'Entrance fees',
      ],
      exclusions: ['Personal expenses', 'Gratuities'],
      location: 'Puerto Princesa, Palawan',
    },
  });

  await prisma.tourPricing.createMany({
    data: [
      {
        tourId: dayTour.id,
        pricingType: PricingType.JOINER,
        minGroupSize: 1,
        maxGroupSize: 10,
        price: 1500,
        isGroupPrice: false,
      },
      {
        tourId: dayTour.id,
        pricingType: PricingType.PRIVATE,
        minGroupSize: 1,
        maxGroupSize: 2,
        price: 4000,
        isGroupPrice: false,
      },
      {
        tourId: dayTour.id,
        pricingType: PricingType.PRIVATE,
        minGroupSize: 3,
        maxGroupSize: 5,
        price: 7000,
        isGroupPrice: false,
      },
    ],
  });

  await prisma.tourScheduleOption.createMany({
    data: [
      {
        tourId: dayTour.id,
        schedule: 'MORNING',
      },
      {
        tourId: dayTour.id,
        schedule: 'AFTERNOON',
      },
    ],
  });

  await prisma.itinerary.create({
    data: {
      tourId: dayTour.id,
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

  // Tour
  const tour = await prisma.tour.create({
    data: {
      name: '2 days 1 night Puerto Princesa Underground River Tour',
      slug: '2-days-1-night-puerto-princesa-underground-river-tour',
      description:
        'Explore the stunning underground river in Puerto Princesa, Palawan.',
      inclusions: [
        'Hotel pickup and drop-off',
        'Lunch',
        'Tour guide',
        'Entrance fees',
      ],
      exclusions: ['Personal expenses', 'Gratuities'],
      location: 'Puerto Princesa, Palawan',
      types: 'PACKAGE',
    },
  });

  await prisma.itinerary.create({
    data: {
      tourId: tour.id,
      days: {
        create: [
          {
            dayNumber: 1,
            title: 'Hotel Pickup and Travel to Underground River',
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
                  title: 'Travel to Underground River',
                  description:
                    'Enjoy the scenic drive to the underground river, passing through beautiful landscapes and local villages.',
                  order: 2,
                },
              ],
            },
          },
          {
            dayNumber: 2,
            title: 'Underground River Tour and Return',
            items: {
              create: [
                {
                  time: '10:30 AM - 12:30 PM',
                  title: 'Underground River Tour',
                  description:
                    'Explore the stunning underground river with our expert guide, marveling at the unique rock formations and diverse wildlife.',
                  order: 1,
                },
                {
                  time: '12:30 PM - 1:30 PM',
                  title: 'Lunch',
                  description:
                    'Enjoy a delicious lunch featuring local cuisine at a nearby restaurant.',
                  order: 2,
                },
                {
                  time: '1:30 PM - 3:00 PM',
                  title: 'Return to Hotel',
                  description:
                    'Relax during the scenic drive back to your hotel, reflecting on the unforgettable experience.',
                  order: 3,
                },
              ],
            },
          },
        ],
      },
    },
  });

  // Pricing (joiner + private)
  await prisma.tourPricing.createMany({
    data: [
      {
        tourId: tour.id,
        pricingType: PricingType.JOINER,
        minGroupSize: 1,
        maxGroupSize: 10,
        price: 2000,
        isGroupPrice: false,
      },
      {
        tourId: tour.id,
        pricingType: PricingType.PRIVATE,
        minGroupSize: 1,
        maxGroupSize: 2,
        price: 5000,
        isGroupPrice: true,
      },
      {
        tourId: tour.id,
        pricingType: PricingType.PRIVATE,
        minGroupSize: 3,
        maxGroupSize: 5,
        price: 8000,
        isGroupPrice: true,
      },
    ],
  });

  console.log('✅ Seed completed');
  console.log('👤 Admin:', admin.email);
  console.log('👤 User:', user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
