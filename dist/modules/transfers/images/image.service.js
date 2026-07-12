"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignTransferImages = assignTransferImages;
exports.updateTransferImages = updateTransferImages;
exports.setFeaturedService = setFeaturedService;
const cloudinary_1 = __importDefault(require("../../../config/cloudinary"));
const prisma_1 = require("../../../config/prisma");
const transfer_query_1 = require("../transfer.query");
async function assignTransferImages(tx, transferId, imageIds) {
    if (imageIds.length) {
        await tx.image.updateMany({
            where: { id: { in: imageIds } },
            data: {
                transferId,
                status: 'ACTIVE',
                type: 'TRANSFER',
            },
        });
    }
}
async function updateTransferImages(transferId, { existingImageIds, newImageIds, }) {
    await (0, transfer_query_1.findTransferOrThrow)(transferId);
    //get current images
    const currentImages = await prisma_1.prisma.image.findMany({
        where: { transferId },
        select: {
            id: true,
            publicId: true,
        },
    });
    const existingIds = new Set(existingImageIds);
    const imagesToDelete = currentImages.filter((img) => !existingIds.has(img.id));
    if (imagesToDelete.length) {
        //Delete from cloudinary
        await Promise.all(imagesToDelete.map((img) => cloudinary_1.default.uploader.destroy(img.publicId)));
        //delete from the db
        await prisma_1.prisma.image.deleteMany({
            where: {
                id: {
                    in: imagesToDelete.map((img) => img.id),
                },
            },
        });
    }
    if (!newImageIds.length) {
        return { count: 0 };
    }
    //update tours
    return prisma_1.prisma.image.updateMany({
        where: { id: { in: newImageIds } },
        data: {
            transferId,
            status: 'ACTIVE',
            type: 'TRANSFER',
        },
    });
}
async function setFeaturedService({ transferId, imageId, }) {
    return prisma_1.prisma.$transaction(async (tx) => {
        await tx.image.updateMany({
            where: {
                transferId,
                isFeatured: true,
            },
            data: {
                isFeatured: false,
            },
        });
        await tx.image.update({
            where: {
                id: imageId,
                transferId,
            },
            data: {
                isFeatured: true,
            },
        });
    });
}
