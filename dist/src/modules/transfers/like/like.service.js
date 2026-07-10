"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.likedTransfer = likedTransfer;
exports.unlikeTransfer = unlikeTransfer;
const prisma_1 = require("../../../config/prisma");
async function likedTransfer({ transferId, userId, }) {
    return prisma_1.prisma.serviceLike.create({
        data: {
            userId,
            transferId,
            serviceType: 'TRANSFER',
        },
    });
}
async function unlikeTransfer({ transferId, userId, }) {
    return prisma_1.prisma.serviceLike.delete({
        where: {
            userId_serviceType: {
                userId,
                serviceType: 'TRANSFER',
            },
            transferId,
        },
    });
}
