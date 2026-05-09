import { prisma } from '../../../config/prisma';
import { findTourOrFail } from '../tour.query';
import { CancellationPolicyInput } from './cancellation.type';

export async function addCancellationPolicy({
  tourId,
  fullRefundHours,
  partialRefundHours,
  partialRefundPercentage,
  description,
}: CancellationPolicyInput) {
  await findTourOrFail(tourId);

  return prisma.cancellationPolicy.create({
    data: {
      tourId,
      fullRefundHours,
      partialRefundHours,
      partialRefundPercentage,
      description,
    },
  });
}

export async function modifiedPolicy({
  tourId,
  fullRefundHours,
  partialRefundHours,
  partialRefundPercentage,
  description,
}: CancellationPolicyInput) {
  const tour = await findTourOrFail(tourId);

  return prisma.cancellationPolicy.update({
    where: { tourId: tour.id },
    data: {
      fullRefundHours,
      partialRefundHours,
      partialRefundPercentage,
      description,
    },
  });
}

export async function deletedPolicy(tourId: string) {
  return prisma.cancellationPolicy.delete({
    where: {
      tourId,
    },
  });
}
