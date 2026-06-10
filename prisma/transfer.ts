import { prisma } from '../src/config/prisma';
import {
  PricingType,
  TransferLocationType,
  TransferPricingMode,
  TransferType,
} from '../src/generated/prisma/enums';

export async function createTransferLocation(
  name: string,
  type: TransferLocationType,
) {
  return prisma.transferLocation.create({
    data: {
      name,
      type,
    },
  });
}

export async function seedSharedTransfer(
  userId: string,
  originId: string,
  destinationId: string,
) {
  return prisma.$transaction(async (tx) => {
    const transfer = await tx.transfer.create({
      data: {
        name: 'Puerto princesa to Elnido',
        slug: 'puerto-princesa-to-elnido',
        pricingMode: TransferPricingMode.SHARED,
        type: TransferType.VAN,
        hasSchedule: true,
        originId,
        destinationId,
        ownerId: userId,
      },
    });

    await tx.transferSchedule.createMany({
      data: [
        {
          transferId: transfer.id,
          departureTime: '3:00 AM',
          maxPassengers: 12,
        },
        {
          transferId: transfer.id,
          departureTime: '9:00 AM',
          maxPassengers: 12,
        },
        {
          transferId: transfer.id,
          departureTime: '3:00 PM',
          maxPassengers: 12,
        },
      ],
    });

    await tx.transferPricing.create({
      data: {
        transferId: transfer.id,
        pricingType: PricingType.JOINER,
        minPassengers: 1,
        maxPassengers: 12,
        price: 750,
      },
    });

    return transfer;
  });
}

export async function seedExclusiveTransfer(
  userId: string,
  originId: string,
  destinationId: string,
) {
  return prisma.$transaction(async (tx) => {
    const transfer = await prisma.transfer.create({
      data: {
        name: 'Exclusive Lio to Town Proper',
        slug: 'exclusion-lio-to-town-proper',
        type: TransferType.PRIVATE_CAR,
        pricingMode: TransferPricingMode.EXCLUSIVE,
        originId,
        destinationId,
        ownerId: userId,
      },
    });

    await tx.transferPricing.create({
      data: {
        transferId: transfer.id,
        minPassengers: 1,
        maxPassengers: 12,
        price: 3000,
        pricingType: PricingType.PRIVATE,
      },
    });

    return transfer;
  });
}
