import dotenv from 'dotenv';
import { prisma } from '../src/config/prisma';

dotenv.config({ path: '.env.test' });

beforeAll(async () => {
  await prisma.$connect();
});

beforeEach(async () => {
  // await prisma.session.deleteMany();
  // await prisma.account.deleteMany();
  // await prisma.emailVerificationToken.deleteMany();
  // await prisma.passwordResetToken.deleteMany();
  // await prisma.user.deleteMany();

  await prisma.booking.deleteMany();
  // await prisma.tourDailyCapacity.deleteMany();
  // await prisma.tourAvailability.deleteMany();

  await prisma.itinerary.deleteMany();
  await prisma.tourPricing.deleteMany();
  await prisma.tour.deleteMany();
  await prisma.tourDailyCapacity.deleteMany();
  await prisma.tourAvailability.deleteMany();
  await prisma.tourScheduleOption.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
