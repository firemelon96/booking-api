import { prisma } from '../../src/config/prisma';
import {
  PricingType,
  TransferLocationType,
  TransferPricingMode,
  TransferType,
} from '../../src/generated/prisma/enums';
import { addLocationService } from '../../src/modules/locations/location.service';
import { createdTransferService } from '../../src/modules/transfers/transfer.service';

export async function createTransferSeed() {
  await prisma.transferBooking.deleteMany();
  await prisma.transferInventory.deleteMany();
  await prisma.transferPricing.deleteMany();
  await prisma.transferLocation.deleteMany();
  await prisma.transferSchedule.deleteMany();
  await prisma.transfer.deleteMany();

  console.log('Seeding transfer start');

  return prisma.$transaction(async (tx) => {
    const origin = await tx.transferLocation.create({
      data: {
        name: 'Puerto princesa airport',
        type: TransferLocationType.AIRPORT,
      },
    });

    const destination = await tx.transferLocation.create({
      data: {
        name: 'Elnido terminal',
        type: TransferLocationType.TERMINAL,
      },
    });

    const transferShared = await tx.transfer.create({
      data: {
        name: 'Puerto Princesa to El nido',
        slug: 'puerto-princesa-to-el-nido',
        type: TransferType.VAN,
        pricingMode: TransferPricingMode.SHARED,
        basePrice: 800,
        maxPassengers: 12,
        originId: origin.id,
        destinationId: destination.id,
        hasSchedule: true,
      },
    });

    await tx.transferSchedule.createMany({
      data: [
        {
          transferId: transferShared.id,
          departureTime: '3:00AM',
          maxPassengers: 12,
        },
        {
          transferId: transferShared.id,
          departureTime: '9:00AM',
          maxPassengers: 12,
        },
        {
          transferId: transferShared.id,
          departureTime: '3:00PM',
          maxPassengers: 12,
        },
      ],
    });

    await tx.transferPricing.createMany({
      data: [
        {
          price: transferShared.basePrice,
          pricingType: PricingType.JOINER,
          minPassengers: 1,
          maxPassengers: 12,
          transferId: transferShared.id,
        },
      ],
    });

    const transferPrivate = await tx.transfer.create({
      data: {
        name: 'Private Puerto Princesa to El nido',
        slug: 'private-puerto-princesa-to-el-nido',
        type: TransferType.VAN,
        pricingMode: TransferPricingMode.PRIVATE,
        basePrice: 3000,
        maxPassengers: 12,
        originId: origin.id,
        destinationId: destination.id,
      },
    });

    await tx.transferPricing.createMany({
      data: [
        {
          price: transferPrivate.basePrice,
          pricingType: PricingType.PRIVATE,
          minPassengers: 1,
          maxPassengers: 6,
          transferId: transferPrivate.id,
        },
        {
          price: 6000,
          pricingType: PricingType.PRIVATE,
          minPassengers: 7,
          maxPassengers: 12,
          transferId: transferPrivate.id,
        },
      ],
    });
  });
}
