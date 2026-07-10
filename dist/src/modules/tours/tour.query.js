"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findTourBookingOrFail = findTourBookingOrFail;
exports.findTourOrFail = findTourOrFail;
exports.existingTourSlug = existingTourSlug;
exports.getTourById = getTourById;
exports.getTourIdBySlug = getTourIdBySlug;
const prisma_1 = require("../../config/prisma");
async function findTourBookingOrFail(bookingId) {
    const tourBooking = await prisma_1.prisma.tourBooking.findUnique({
        where: { bookingId },
        include: { tour: true },
    });
    if (!tourBooking)
        throw new Error('Tour booking not found');
    return tourBooking;
}
async function findTourOrFail(tourId) {
    const tour = await prisma_1.prisma.tour.findUnique({
        where: { id: tourId },
        include: { schedules: true, images: true },
    });
    if (!tour)
        throw new Error('Tour not found');
    return tour;
}
async function existingTourSlug(slug) {
    const exist = await prisma_1.prisma.tour.findUnique({ where: { slug } });
    if (exist)
        throw new Error('Tour already exist');
    return;
}
async function getTourById(id) {
    const tour = await prisma_1.prisma.tour.findUnique({
        where: { id },
        include: {
            pricing: true,
            itinerary: {
                include: {
                    days: {
                        include: {
                            items: true,
                        },
                    },
                },
            },
        },
    });
    if (!tour)
        throw new Error('Tour not found');
    return tour;
}
async function getTourIdBySlug(slug) {
    const tour = await prisma_1.prisma.tour.findUnique({
        where: { slug },
        select: {
            id: true,
            joinerCapacity: true,
            hasSchedule: true,
        },
    });
    if (!tour)
        throw new Error('Tour not found');
    return tour;
}
