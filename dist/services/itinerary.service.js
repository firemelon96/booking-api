"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addItinerary = addItinerary;
const prisma_1 = require("../config/prisma");
async function addItinerary(params) {
    const tour = await prisma_1.prisma.tour.findUnique({ where: { id: params.tourId } });
    if (!tour) {
        throw new Error('Tour not found');
    }
    return prisma_1.prisma.itinerary.create({
        data: {
            tourId: params.tourId,
            activities: params.activities,
            destinations: params.destinations,
            title: params.title,
        },
    });
}
