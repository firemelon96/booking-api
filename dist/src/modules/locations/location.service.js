"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addLocationService = addLocationService;
exports.updateLocationService = updateLocationService;
exports.removeLocationService = removeLocationService;
exports.listLocationService = listLocationService;
const prisma_1 = require("../../config/prisma");
const location_query_1 = require("./location.query");
async function addLocationService(data) {
    const exist = await prisma_1.prisma.transferLocation.findFirst({
        where: { name: data.name },
    });
    if (exist) {
        throw new Error('Location already exist');
    }
    return prisma_1.prisma.transferLocation.create({
        data,
    });
}
async function updateLocationService(locationId, data) {
    const location = await (0, location_query_1.findLocationOrFail)(locationId);
    return prisma_1.prisma.transferLocation.update({
        where: {
            id: location.id,
        },
        data: {
            ...data,
        },
    });
}
async function removeLocationService(locationId) {
    await (0, location_query_1.findLocationOrFail)(locationId);
    return prisma_1.prisma.transferLocation.delete({ where: { id: locationId } });
}
async function listLocationService({ limit = 10, page = 1, search, sort = 'createdAt:desc', type, }) {
    const safePage = Math.max(page, 1);
    const safeLimit = Math.min(limit, 30);
    const skip = (safePage - 1) * safeLimit;
    const [sortField, sortOrder] = sort.split(':');
    const orderBy = {
        [sortField || 'createdAt']: sortOrder === 'asc' ? 'asc' : 'desc',
    };
    const where = {};
    if (type)
        where.type = type;
    if (search) {
        where.OR = [
            {
                name: {
                    contains: search,
                    mode: 'insensitive',
                },
            },
            {
                address: {
                    contains: search,
                    mode: 'insensitive',
                },
            },
        ];
    }
    const [data, total] = await prisma_1.prisma.$transaction([
        prisma_1.prisma.transferLocation.findMany({
            where,
            skip,
            take: safeLimit,
            orderBy,
        }),
        prisma_1.prisma.transferLocation.count({ where }),
    ]);
    return {
        data: data.map((l) => ({
            id: l.id,
            name: l.name,
            type: l.type,
            address: l.address,
        })),
        meta: {
            total,
            page: safePage,
            pageSize: safeLimit,
            pageCount: Math.ceil(total / safeLimit),
        },
    };
}
