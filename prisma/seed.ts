import bcrypt from 'bcrypt';
import { prisma } from '../src/config/prisma';
import { PricingType, Role } from '../src/generated/prisma/enums';

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data (dev only)
  await prisma.booking.deleteMany();
  await prisma.tourPricing.deleteMany();
  await prisma.tour.deleteMany();
  await prisma.user.deleteMany();

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

  // Tour
  const tour = await prisma.tour.create({
    data: {
      name: 'Puerto Princesa Underground River Tour',
      slug: 'puerto-princesa-underground-river',
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

  // Booking (snapshot example)
  await prisma.booking.create({
    data: {
      userId: user.id,
      tourId: tour.id,
      totalPrice: 5000,
      startDate: new Date('2026-02-01'),
      pricingType: PricingType.JOINER,
      participants: 3,
    },
  });

  //create itinerary fo the tour
  // await prisma.itinerary.create({
  //   data: {
  //     tourId: tour.id,
  //     day: 1,
  //     title: 'Hotel Pickup and Travel to Underground River',
  //     description:
  //       'Our friendly guide will pick you up from your hotel in Puerto Princesa and take you to the underground river. Enjoy the scenic drive and get ready for an unforgettable adventure.',
  //   },
  // });

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
