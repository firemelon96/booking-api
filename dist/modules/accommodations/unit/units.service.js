"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createdUnit = createdUnit;
exports.updatedUnit = updatedUnit;
exports.listUnits = listUnits;
exports.deleteUnit = deleteUnit;
const prisma_1 = require("../../../config/prisma");
const slugify_1 = require("../../../utils/slugify");
const accommodation_query_1 = require("../accommodation.query");
const units_query_1 = require("./units.query");
async function createdUnit(accommodationId, data) {
    const accommodation = await (0, accommodation_query_1.findAccommodationOrFail)(accommodationId);
    if (!accommodation.hasUnits) {
        throw new Error('This accommodation does not support unit');
    }
    const slug = (0, slugify_1.slugify)(data.name);
    const unitExist = await prisma_1.prisma.accommodationUnit.findUnique({
        where: {
            accommodationId_slug: {
                accommodationId,
                slug,
            },
        },
    });
    if (unitExist) {
        throw new Error('Unit already exist');
    }
    const { amenityIds = [], ...unitData } = data;
    return prisma_1.prisma.$transaction(async (tx) => {
        const unit = await tx.accommodationUnit.create({
            data: {
                ...unitData,
                accommodationId,
                slug,
            },
        });
        if (amenityIds.length > 0) {
            await tx.accommodationUnitAmenity.createMany({
                data: amenityIds.map((amenityId) => ({
                    unitId: unit.id,
                    amenityId,
                })),
                skipDuplicates: true,
            });
        }
        return unit;
    });
}
async function updatedUnit(accommodationId, unitId, data) {
    await (0, accommodation_query_1.findAccommodationOrFail)(accommodationId);
    await (0, units_query_1.findUnitOrFail)(unitId);
    const { amenityIds = [], ...unitData } = data;
    return prisma_1.prisma.$transaction(async (tx) => {
        const updated = await tx.accommodationUnit.update({
            where: { id: unitId },
            data: unitData,
        });
        if (amenityIds) {
            await tx.accommodationUnitAmenity.deleteMany({
                where: { unitId },
            });
            if (amenityIds.length > 0) {
                await tx.accommodationUnitAmenity.createMany({
                    data: amenityIds.map((amenityId) => ({
                        unitId,
                        amenityId,
                    })),
                    skipDuplicates: true,
                });
            }
        }
        return updated;
    });
}
async function listUnits({ page = 1, limit = 30, search, sort = 'createdAt:desc', accommodationId, }) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(10, limit);
    const skip = (safePage - 1) * safeLimit;
    const [sortField, sortOrder] = sort.split(':');
    const orderBy = {
        [sortField || 'createdAt']: sortOrder === 'asc' ? 'asc' : 'desc',
    };
    const where = {};
    if (accommodationId) {
        where.accommodationId = accommodationId;
    }
    if (search) {
        where.OR = [
            {
                name: {
                    contains: search,
                    mode: 'insensitive',
                },
            },
            {
                description: {
                    contains: search,
                    mode: 'insensitive',
                },
            },
        ];
    }
    const [data, total] = await prisma_1.prisma.$transaction([
        prisma_1.prisma.accommodationUnit.findMany({
            where,
            skip,
            take: safeLimit,
            orderBy,
        }),
        prisma_1.prisma.accommodationUnit.count({ where }),
    ]);
    return {
        data: data.map((u) => ({
            id: u.id,
            unitName: u.name,
            description: u.description,
            quantity: u.quantity,
            price: u.basePrice,
        })),
        meta: {
            total,
            page: safePage,
            pageSize: safeLimit,
            pageCount: Math.ceil(total / safeLimit),
        },
    };
}
async function deleteUnit(accommodationId, unitId) {
    await (0, accommodation_query_1.findAccommodationOrFail)(accommodationId);
    await (0, units_query_1.findUnitOrFail)(unitId);
    return prisma_1.prisma.accommodationUnit.delete({
        where: {
            id: unitId,
        },
    });
}
