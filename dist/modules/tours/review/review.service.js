"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addReviewService = addReviewService;
const prisma_1 = require("../../../config/prisma");
async function addReviewService(userId, tourId, { starRating, comment, imageIds }) {
    return prisma_1.prisma.$transaction(async (tx) => {
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
