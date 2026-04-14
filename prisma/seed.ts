import bcrypt from 'bcrypt';
import { prisma } from '../src/config/prisma';
import {
  PricingModel,
  PricingType,
  Role,
  TourSchedule,
} from '../src/generated/prisma/enums';
import { seedExclusive } from './exclusive';
import { seedShared } from './shared';
import { seedMixed } from './mixed';
import { seedMixedDayTour } from './mixed-day';

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data (dev only)
  await prisma.booking.deleteMany();
  await prisma.tourPricing.deleteMany();
  await prisma.tour.deleteMany();
  await prisma.user.deleteMany();
  await prisma.itinerary.deleteMany();
  await prisma.tourScheduleOption.deleteMany();
  await prisma.tourDailyCapacity.deleteMany();

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

  const exclusiveTour = await seedExclusive();
  const sharedTour = await seedShared();
  const mixedTour = await seedMixed();
  const mixedDayTour = await seedMixedDayTour();

  console.log('✅ Seed completed');
  console.log('👤 Admin:', admin.email);
  console.log('👤 User:', user.email);
  console.log('⛰️ Exclusive tour', exclusiveTour.id);
  console.log('🚵 Shared tour', sharedTour.id);
  console.log('🌅 Mixed package tour', mixedTour.id);
  console.log('🌅 Mixed day tour', mixedDayTour.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
