"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAmenities = fetchAmenities;
exports.createdAmenity = createdAmenity;
const prisma_1 = require("../../config/prisma");
const slugify_1 = require("../../utils/slugify");
async function fetchAmenities() {
    return prisma_1.prisma.amenity.findMany({
        orderBy: {
            createdAt: 'asc',
        },
    });
}
async function createdAmenity({ name, icon }) {
    const slug = (0, slugify_1.slugify)(name);
    const existing = await prisma_1.prisma.amenity.findFirst({
        where: {
            OR: [{ name }, { slug }],
        },
    });
    if (existing) {
        throw new Error('Amenity already exist');
    }
    return prisma_1.prisma.amenity.create({
        data: {
            name,
            slug,
            icon,
        },
    });
}
