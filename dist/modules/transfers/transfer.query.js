"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSort = parseSort;
exports.throwExistingSlug = throwExistingSlug;
exports.findTransferBySlugOrFail = findTransferBySlugOrFail;
exports.findTransferOrThrow = findTransferOrThrow;
exports.buildTransferWhere = buildTransferWhere;
const prisma_1 = require("../../config/prisma");
const ALLOWED_SORT_FIELDS = [
    'createdAt',
    'name',
    'type',
    'pricingMode',
];
function parseSort(sort) {
    const [rawField, rawOrder] = sort?.split(':') ?? [];
    const field = ALLOWED_SORT_FIELDS.includes(rawField)
        ? rawField
        : 'createdAt';
    const order = rawOrder === 'asc' ? 'asc' : 'desc';
    return { field, order };
}
async function throwExistingSlug(slug) {
    //lookup for the tranfer using slug and trow if exist
    const slugExist = await prisma_1.prisma.transfer.findUnique({
        where: { slug },
    });
    if (slugExist) {
        throw new Error('Transfer already exist');
    }
    return slugExist;
}
async function findTransferBySlugOrFail(slug) {
    const transfer = await prisma_1.prisma.transfer.findUnique({
        where: {
            slug,
        },
        include: {
            destination: true,
            origin: true,
            pricing: true,
            schedules: true,
            images: true,
        },
    });
    if (!transfer) {
        throw new Error('Transfer not found');
    }
    return transfer;
}
async function findTransferOrThrow(transferId) {
    const transfer = await prisma_1.prisma.transfer.findUnique({
        where: {
            id: transferId,
        },
        include: {
            pricing: true,
            schedules: true,
            images: true,
        },
    });
    if (!transfer) {
        throw new Error('Transfer not found');
    }
    return transfer;
}
function buildTransferWhere({ pricingMode, search, type, }) {
    return {
        ...(type && { type }),
        ...(pricingMode && { pricingMode }),
        ...(search && {
            OR: [
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
                {
                    origin: {
                        name: {
                            contains: search,
                            mode: 'insensitive',
                        },
                    },
                },
                {
                    destination: {
                        name: {
                            contains: search,
                            mode: 'insensitive',
                        },
                    },
                },
            ],
        }),
    };
}
