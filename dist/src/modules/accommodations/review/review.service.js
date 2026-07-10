"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addReviewService = addReviewService;
const prisma_1 = require("../../../config/prisma");
async function addReviewService(userId, accommodationId, { starRating, comment, imageIds, unitId }) {
    return prisma_1.prisma.$transaction(async (tx) => {
        const accommodation = await tx.accommodation.findUnique({
            where: { id: accommodationId },
            include: { units: true },
        });
        if (!accommodation) {
            throw new Error('Accommodation not found');
        }
        if (accommodation.hasUnits && !unitId) {
            throw new Error('Unit is required');
        }
        if (unitId) {
            const unit = await tx.accommodationUnit.findUnique({
                where: { id: unitId },
            });
            if (!unit) {
                throw new Error('Unit not found');
            }
            await tx.review.create({
                data: {
                    userId,
                    unitId: unit?.id,
                    comment,
                    starRating,
                },
            });
            if (imageIds.length > 0) {
                await tx.image.updateMany({
                    where: { unitId: unit.id },
                    data: {
                        type: 'REVIEW',
                        status: 'ACTIVE',
                    },
                });
            }
        }
        await tx.review.create({
            data: {
                userId,
                accommodationId: accommodation?.id,
                comment,
                starRating,
            },
        });
        if (imageIds.length > 0) {
            await tx.image.updateMany({
                where: { accommodationId: accommodation.id },
                data: {
                    type: 'REVIEW',
                    status: 'ACTIVE',
                },
            });
        }
    });
}
