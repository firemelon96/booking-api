"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.likedTour = likedTour;
exports.unlikeTour = unlikeTour;
const prisma_1 = require("../../../config/prisma");
async function likedTour({ tourId, userId, }) {
    return prisma_1.prisma.serviceLike.create({
        data: {
            userId,
            tourId,
            serviceType: 'TOUR',
        },
    });
}
async function unlikeTour({ tourId, userId, }) {
    return prisma_1.prisma.serviceLike.delete({
        where: {
            userId_serviceType: {
                userId,
                serviceType: 'TOUR',
            },
            tourId,
        },
    });
}
