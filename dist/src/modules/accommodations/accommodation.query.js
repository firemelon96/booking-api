"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findAccommodationOrFail = findAccommodationOrFail;
exports.findAccommodationBySlug = findAccommodationBySlug;
const prisma_1 = require("../../config/prisma");
async function findAccommodationOrFail(accommodationId) {
    const accommodation = await prisma_1.prisma.accommodation.findUnique({
        where: { id: accommodationId },
    });
    if (!accommodation) {
        throw new Error('Accommodation not found');
    }
    return accommodation;
}
async function findAccommodationBySlug(slug) {
    const accom = await prisma_1.prisma.accommodation.findUnique({
        where: {
            slug,
        },
        include: {
            amenities: true,
            images: true,
            units: true,
        },
    });
    if (!accom) {
        throw new Error('Accommodation not found');
    }
    return accom;
}
