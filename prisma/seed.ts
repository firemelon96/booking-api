import bcrypt from 'bcrypt';
import { prisma } from '../src/config/prisma';
import {
  PricingModel,
  PricingType,
  Role,
  TourSchedule,
} from '../src/generated/prisma/enums';
import { seedMixed } from './mixed';
import { seedShared } from './shared';
import { seedExclusive } from './exclusive';
import { seedAmenity } from './amenity';
import { seedAccom } from './accom';
import { seedUnitAccom } from './unit-accom';
import {
  createTransferLocation,
  seedExclusiveTransfer,
  seedSharedTransfer,
} from './transfer';
import { seedRental } from './rental';

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data (dev only)

  // Password hash
  const password = await bcrypt.hash('password123', 10);

  // Users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password,
      role: Role.ADMIN,
      emailVerified: true,
    },
  });

  const user = await prisma.user.create({
    data: {
      email: 'user@example.com',
      password,
      role: Role.USER,
      emailVerified: true,
    },
  });

  const amenities = await seedAmenity();
  const amenityIds = amenities.map((a) => a.id);

  const createMixedTour = await seedMixed(admin.id);
  const sharedTour = await seedShared(admin.id);
  const exclusiveTour = await seedExclusive(admin.id);

  const bookableAccom = await seedAccom(admin.id, amenityIds);
  const unitAccom = await seedUnitAccom(admin.id, amenityIds);

  const airport = await createTransferLocation(
    'Puerto princesa Airport',
    'AIRPORT',
  );

  const terminal = await createTransferLocation('Elnido terminal', 'TERMINAL');

  const sharedTransfer = await seedSharedTransfer(
    admin.id,
    airport.id,
    terminal.id,
  );
  const exclusiveTransfer = await seedExclusiveTransfer(
    admin.id,
    airport.id,
    terminal.id,
  );

  const rental = await seedRental(admin.id);

  console.log('✅ Seed completed');
  console.log('👤 Admin:', admin.email);
  console.log('👤 User:', user.email);
  console.log('⛰️ Exclusive tour', exclusiveTour.slug);
  console.log('🚵 Shared tour', sharedTour.slug);
  console.log('🌅 Mixed package tour', createMixedTour.slug);
  console.log('🌅 Mixed package tour', bookableAccom.slug);
  console.log('🌅 Mixed package tour', unitAccom.slug);
  console.log('🌅 Mixed package tour', sharedTransfer.slug);
  console.log('🌅 Mixed package tour', exclusiveTransfer.slug);
  console.log('🌅 Mixed package tour', rental.slug);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
