import dotenv from 'dotenv';
import { prisma } from '../src/config/prisma';

dotenv.config({ path: '.env.test' });

beforeEach(async () => {
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.emailVerificationToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
