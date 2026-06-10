import { prisma } from '../../../config/prisma';

export async function likedTour({
  tourId,
  userId,
}: {
  tourId: string;
  userId: string;
}) {
  return prisma.serviceLike.create({
    data: {
      userId,
      tourId,
      serviceType: 'TOUR',
    },
  });
}

export async function unlikeTour({
  tourId,
  userId,
}: {
  tourId: string;
  userId: string;
}) {
  return prisma.serviceLike.delete({
    where: {
      userId_serviceType: {
        userId,
        serviceType: 'TOUR',
      },
      tourId,
    },
  });
}
