import { prisma } from '../../../config/prisma';

export async function likedTour({
  tourId,
  userId,
}: {
  tourId: string;
  userId: string;
}) {
  return prisma.tourLike.create({
    data: {
      userId,
      tourId,
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
  return prisma.tourLike.delete({
    where: {
      userId_tourId: {
        tourId,
        userId,
      },
    },
  });
}
