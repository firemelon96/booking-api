import { prisma } from '../../../config/prisma';
import { ReviewInput } from './review.type';

export async function addReviewService(
  userId: string,
  tourId: string,
  { starRating, comment, imageIds }: ReviewInput,
) {
  return prisma.$transaction(async (tx) => {
    const review = await tx.review.create({
      data: {
        starRating,
        comment,
        userId,
        tourId,
      },
    });

    if (imageIds.length > 0) {
      await tx.image.updateMany({
        where: { reviewId: review.id },
        data: {
          type: 'REVIEW',
          status: 'ACTIVE',
        },
      });
    }
  });
}
