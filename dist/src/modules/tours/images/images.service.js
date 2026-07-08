"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachImages = attachImages;
exports.updateTourImages = updateTourImages;
exports.setFeaturedService = setFeaturedService;
const cloudinary_1 = __importDefault(require("../../../config/cloudinary"));
const prisma_1 = require("../../../config/prisma");
const tour_query_1 = require("../tour.query");
async function attachImages(tx, tourId, imageIds) {
    if (imageIds.length) {
        await tx.image.updateMany({
            where: { id: { in: imageIds } },
            data: {
                tourId,
                status: 'ACTIVE',
                type: 'TOUR',
            },
        });
    }
}
async function updateTourImages(id, input) {
    await (0, tour_query_1.findTourOrFail)(id);
    //get current images
    const currentImages = await prisma_1.prisma.image.findMany({
        where: { tourId: id },
        select: {
            id: true,
            publicId: true,
        },
    });
    const existingIds = new Set(input.existingImageIds);
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
    if (!input.newImageIds.length) {
        return { count: 0 };
    }
    //update tours
    return prisma_1.prisma.image.updateMany({
        where: { id: { in: input.newImageIds } },
        data: {
            tourId: id,
            status: 'ACTIVE',
            type: 'TOUR',
        },
    });
}
async function setFeaturedService({ tourId, imageId, }) {
    return prisma_1.prisma.$transaction(async (tx) => {
        await tx.image.updateMany({
            where: {
                tourId,
                isFeatured: true,
            },
            data: {
                isFeatured: false,
            },
        });
        await tx.image.update({
            where: {
                id: imageId,
                tourId,
            },
            data: {
                isFeatured: true,
            },
        });
    });
}
