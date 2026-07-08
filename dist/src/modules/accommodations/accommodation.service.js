"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createdAccommodation = createdAccommodation;
exports.getAccommodationDetailService = getAccommodationDetailService;
exports.listAccommodation = listAccommodation;
exports.updatedAccommodation = updatedAccommodation;
exports.removedAccommodation = removedAccommodation;
const prisma_1 = require("../../config/prisma");
const slugify_1 = require("../../utils/slugify");
const accommodation_query_1 = require("./accommodation.query");
async function createdAccommodation(ownerId, data) {
    const slug = (0, slugify_1.slugify)(data.name);
    const existing = await prisma_1.prisma.accommodation.findUnique({
        where: {
            slug,
        },
    });
    if (existing) {
        throw new Error('Accommodation already exist');
    }
    const { amenityIds = [], ...accommodationData } = data;
    return prisma_1.prisma.$transaction(async (tx) => {
        const accommodation = await tx.accommodation.create({
            data: {
                ...accommodationData,
                slug,
                ownerId,
            },
        });
        if (amenityIds.length > 0) {
            await tx.accommodationAmenity.createMany({
                data: amenityIds.map((amenityId) => ({
                    accommodationId: accommodation.id,
                    amenityId,
                })),
                skipDuplicates: true,
            });
        }
        return accommodation;
    });
}
async function getAccommodationDetailService(slug) {
    const accommodation = await (0, accommodation_query_1.findAccommodationBySlug)(slug);
    return accommodation;
}
async function listAccommodation({ page = 1, limit = 20, sort = 'createdAt:desc', search, type, }) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(30, limit);
    const skip = (safePage - 1) * safeLimit;
    const [sortField, sortOrder] = sort.split(':');
    const orderBy = {
        [sortField || 'createdAt']: sortOrder === 'asc' ? 'asc' : 'desc',
    };
    const where = {
        ...(type && { type }),
        ...(search && {
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ],
        }),
    };
    const [data, total] = await prisma_1.prisma.$transaction([
        prisma_1.prisma.accommodation.findMany({
            where,
            skip,
            take: safeLimit,
            orderBy,
            include: {
                units: {
                    select: { name: true, id: true },
                },
                amenities: {
                    select: {
                        amenity: {
                            select: {
                                slug: true,
                            },
                        },
                    },
                },
            },
        }),
        prisma_1.prisma.accommodation.count({ where }),
    ]);
    return {
        data: data.map((a) => ({
            id: a.id,
            accommodationName: a.name,
            slug: a.slug,
            description: a.description,
            type: a.type,
            address: a.address,
            checkIn: a.checkInTime,
            checkOut: a.checkOutTime,
            hasUnit: a.hasUnits,
            isBookable: a.isBookable,
            units: a.units.map((u) => ({ id: u.id, name: u.name })),
            amenities: a.amenities,
        })),
        meta: {
            total,
            page: safePage,
            pageSize: safeLimit,
            pageCount: Math.ceil(total / safeLimit),
        },
    };
}
async function updatedAccommodation(accommodationId, data) {
    await (0, accommodation_query_1.findAccommodationOrFail)(accommodationId);
    const { amenityIds = [], ...accommodationData } = data;
    return prisma_1.prisma.$transaction(async (tx) => {
        const updated = await tx.accommodation.update({
            where: {
                id: accommodationId,
            },
            data: accommodationData,
        });
        if (amenityIds) {
            await tx.accommodationAmenity.deleteMany({
                where: { accommodationId },
            });
            if (amenityIds.length > 0) {
                await tx.accommodationAmenity.createMany({
                    data: amenityIds.map((amenityId) => ({
                        accommodationId,
                        amenityId,
                    })),
                    skipDuplicates: true,
                });
            }
        }
        return updated;
    });
}
async function removedAccommodation(accommodationId) {
    await (0, accommodation_query_1.findAccommodationOrFail)(accommodationId);
    return prisma_1.prisma.accommodation.delete({
        where: { id: accommodationId },
    });
}
