"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllRentalsService = getAllRentalsService;
exports.getRentalDetailService = getRentalDetailService;
exports.createRentalService = createRentalService;
exports.updateRentalService = updateRentalService;
exports.removeRentalService = removeRentalService;
const prisma_1 = require("../../config/prisma");
const slugify_1 = require("../../utils/slugify");
const rental_query_1 = require("./rental.query");
async function getAllRentalsService({ limit, page, search, sort = 'createdAt:desc', type, }) {
    const safePage = Math.max(1, page || 1);
    const safeLimit = Math.max(1, limit || 20);
    const skip = (safePage - 1) * safeLimit;
    const [sortField, sortOrder] = sort.split(':');
    const orderBy = {
        [sortField || 'createdAt']: sortOrder === 'asc' ? 'asc' : 'desc',
    };
    const where = {};
    if (type) {
        where.type = type;
    }
    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            {
                rentalItems: {
                    some: { name: { contains: search, mode: 'insensitive' } },
                },
            },
        ];
    }
    const [data, total] = await prisma_1.prisma.$transaction([
        prisma_1.prisma.rental.findMany({
            where,
            skip,
            take: safeLimit,
            orderBy,
            include: {
                amenities: {
                    select: {
                        amenity: {
                            select: {
                                slug: true,
                            },
                        },
                    },
                },
                rentalItems: {
                    include: {
                        pricing: true,
                    },
                },
            },
        }),
        prisma_1.prisma.rental.count({ where }),
    ]);
    return {
        data: data.map((r) => ({
            id: r.id,
            name: r.name,
            slug: r.slug,
            description: r.description,
            type: r.type,
            amenities: r.amenities.map((a) => a.amenity.slug),
            items: r.rentalItems.map((i) => ({
                id: i.id,
                name: i.name,
                description: i.description,
                itemCode: i.itemCode,
                quantity: i.quantity,
                pricing: i.pricing.map((p) => ({
                    price: p.price,
                    pricingType: p.pricingType,
                })),
            })),
        })),
        meta: {
            total,
            page: safePage,
            limit: safeLimit,
        },
    };
}
async function getRentalDetailService(slug) {
    await (0, rental_query_1.findRentalBySlugOrFail)(slug);
    const rental = await prisma_1.prisma.rental.findUnique({
        where: { slug },
        include: {
            amenities: {
                select: {
                    amenity: {
                        select: {
                            slug: true,
                        },
                    },
                },
            },
            rentalItems: {
                include: {
                    pricing: true,
                },
            },
        },
    });
    return {
        id: rental?.id,
        name: rental?.name,
        slug: rental?.slug,
        description: rental?.description,
        type: rental?.type,
        amenities: rental?.amenities.map((a) => a.amenity.slug),
        items: rental?.rentalItems.map((i) => ({
            name: i.name,
            description: i.description,
            itemCode: i.itemCode,
            quantity: i.quantity,
            pricing: i.pricing.map((p) => ({
                price: p.price,
                pricingType: p.pricingType,
            })),
        })),
    };
}
async function createRentalService(userId, { items, name, type, amenityIds, description, imageIds }) {
    const slug = (0, slugify_1.slugify)(name);
    await (0, rental_query_1.throwExistingRentalBySlug)(slug);
    return prisma_1.prisma.$transaction(async (tx) => {
        const rental = await tx.rental.create({
            data: {
                name,
                description,
                type,
                slug,
                ownerId: userId,
            },
        });
        if (amenityIds && amenityIds.length > 0) {
            await tx.rentalAmenity.createMany({
                data: amenityIds.map((amenityId) => ({
                    rentalId: rental.id,
                    amenityId,
                })),
            });
        }
        //attach image
        if (imageIds && imageIds.length > 0) {
            await tx.image.updateMany({
                where: { id: { in: imageIds } },
                data: {
                    rentalId: rental.id,
                    status: 'ACTIVE',
                    type: 'RENTAL',
                },
            });
        }
        for (const item of items) {
            const rentalItem = await tx.rentalItem.create({
                data: {
                    name: item.name,
                    description: item.description,
                    itemCode: item.itemCode,
                    quantity: item.quantity,
                    rentalId: rental.id,
                },
            });
            if (item.pricing && item.pricing.length > 0) {
                await tx.rentalPricing.createMany({
                    data: item.pricing.map((pricing) => ({
                        rentalItemId: rentalItem.id,
                        price: pricing.price,
                        pricingType: pricing.pricingType,
                    })),
                });
            }
        }
        return rental;
    });
}
async function updateRentalService(rentalId, { amenityIds, imageIds, ...rentalData }) {
    await (0, rental_query_1.findRentalByIdOrFail)(rentalId);
    const slug = rentalData.name ? (0, slugify_1.slugify)(rentalData.name) : undefined;
    if (slug) {
        await (0, rental_query_1.throwExistingRentalBySlug)(slug);
    }
    return prisma_1.prisma.$transaction(async (tx) => {
        const updatedRental = await tx.rental.update({
            where: { id: rentalId },
            data: {
                ...rentalData,
                slug,
            },
        });
        if (amenityIds) {
            await tx.rentalAmenity.deleteMany({ where: { rentalId } });
            if (amenityIds.length > 0) {
                await tx.rentalAmenity.createMany({
                    data: amenityIds.map((amenityId) => ({
                        rentalId,
                        amenityId,
                    })),
                });
            }
        }
        return updatedRental;
    });
}
async function removeRentalService(rentalId) {
    await (0, rental_query_1.findRentalByIdOrFail)(rentalId);
    return prisma_1.prisma.$transaction(async (tx) => {
        await tx.rentalAmenity.deleteMany({ where: { rentalId } });
        await tx.rental.delete({ where: { id: rentalId } });
    });
}
