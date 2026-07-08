"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAllUser = fetchAllUser;
exports.fetchProfile = fetchProfile;
const prisma_1 = require("../../config/prisma");
async function fetchAllUser({ role, search, limit = 10, page = 1, sort = 'createdAt:desc', }) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(30, limit);
    const skip = (safePage - 1) * safeLimit;
    const [sortField, sortOrder] = sort.split(':');
    const orderBy = {
        [sortField || 'createdAt']: sortOrder === 'asc' ? 'asc' : 'desc',
    };
    const where = {};
    if (role) {
        where.role = role;
    }
    if (search) {
        where.email = { contains: search, mode: 'insensitive' };
    }
    const [data, total] = await prisma_1.prisma.$transaction([
        prisma_1.prisma.user.findMany({
            where,
            skip,
            take: safeLimit,
            orderBy,
        }),
        prisma_1.prisma.user.count({ where }),
    ]);
    return {
        data: data.map((u) => ({
            id: u.id,
            email: u.email,
            verified: u.emailVerified,
            role: u.role,
        })),
        meta: {
            total,
            page: safePage,
            pageSize: safeLimit,
            pageCount: Math.ceil(total / safeLimit),
        },
    };
}
async function fetchProfile(userId) {
    return prisma_1.prisma.user.findUnique({
        where: { id: userId },
        include: {
            bookings: true,
            reviews: true,
            likedService: true,
        },
    });
}
