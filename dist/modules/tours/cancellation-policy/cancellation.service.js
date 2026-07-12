"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addCancellationPolicy = addCancellationPolicy;
exports.modifiedPolicy = modifiedPolicy;
exports.deletedPolicy = deletedPolicy;
const prisma_1 = require("../../../config/prisma");
const tour_query_1 = require("../tour.query");
async function addCancellationPolicy({ tourId, fullRefundHours, partialRefundHours, partialRefundPercentage, description, }) {
    await (0, tour_query_1.findTourOrFail)(tourId);
    return prisma_1.prisma.cancellationPolicy.create({
        data: {
            tourId,
            fullRefundHours,
            partialRefundHours,
            partialRefundPercentage,
            description,
        },
    });
}
async function modifiedPolicy({ tourId, fullRefundHours, partialRefundHours, partialRefundPercentage, description, }) {
    const tour = await (0, tour_query_1.findTourOrFail)(tourId);
    return prisma_1.prisma.cancellationPolicy.update({
        where: { tourId: tour.id },
        data: {
            fullRefundHours,
            partialRefundHours,
            partialRefundPercentage,
            description,
        },
    });
}
async function deletedPolicy(tourId) {
    return prisma_1.prisma.cancellationPolicy.delete({
        where: {
            tourId,
        },
    });
}
