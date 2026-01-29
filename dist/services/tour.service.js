"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTours = listTours;
exports.getTourBySlug = getTourBySlug;
exports.createTour = createTour;
exports.updateTour = updateTour;
exports.deleteTour = deleteTour;
const prisma_1 = require("../config/prisma");
const slugify_1 = require("../utils/slugify");
async function listTours() {
    return prisma_1.prisma.tour.findMany({
        orderBy: [{ name: 'asc' }],
        include: { pricing: true },
    });
}
async function getTourBySlug(slug) {
    const tour = await prisma_1.prisma.tour.findUnique({
        where: {
            slug,
        },
        include: { pricing: true },
    });
    if (!tour)
        throw new Error('Tour not found');
    return tour;
}
async function createTour(input) {
    const slug = input.slug ? input.slug : (0, slugify_1.slugify)(input.name);
    const exists = await prisma_1.prisma.tour.findUnique({ where: { slug } });
    if (exists) {
        throw new Error('Slug already exists');
    }
    return prisma_1.prisma.tour.create({
        data: {
            name: input.name,
            slug,
        },
    });
}
async function updateTour(id, input) {
    const existing = await prisma_1.prisma.tour.findUnique({ where: { id } });
    if (!existing)
        throw new Error('Tour not found');
    const nextSlug = input.slug ?? (input.name ? (0, slugify_1.slugify)(input.name) : undefined);
    if (nextSlug && nextSlug !== existing.slug) {
        const slugExists = await prisma_1.prisma.tour.findUnique({
            where: { slug: nextSlug },
        });
        if (slugExists)
            throw new Error('Slug already exists');
    }
    return prisma_1.prisma.tour.update({
        where: { id },
        data: {
            name: input.name ?? undefined,
            slug: nextSlug ?? undefined,
        },
    });
}
async function deleteTour(id) {
    const existing = await prisma_1.prisma.tour.findUnique({ where: { id } });
    if (!existing)
        throw new Error('Tour not found!');
    return prisma_1.prisma.tour.delete({ where: { id } });
}
