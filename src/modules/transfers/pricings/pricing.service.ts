import { success } from 'zod';
import { prisma } from '../../../config/prisma';
import { Prisma } from '../../../generated/prisma/client';
import { findTransferOrThrow } from '../transfer.query';
import { TransferPricingInput } from './pricing.type';
import { validateTransferPricing } from './pricing.rule';

export async function createTransferPricing(
  tx: Prisma.TransactionClient,
  transferId: string,
  pricing: TransferPricingInput[],
) {
  return tx.transferPricing.createMany({
    data: pricing.map((p) => ({
      ...p,
      transferId,
    })),
  });
}

export async function modifyTransferPricing(
  transferId: string,
  pricing: TransferPricingInput[],
) {
  const transfer = await findTransferOrThrow(transferId);

  validateTransferPricing(transfer.pricingMode, pricing);

  return prisma.$transaction(async (tx) => {
    await tx.transferPricing.deleteMany({
      where: { transferId: transfer.id },
    });

    await tx.transferPricing.createMany({
      data: pricing.map((p) => ({
        ...p,
        transferId: transfer.id,
      })),
    });

    return { success: true, message: 'Updated pricing' };
  });
}
