"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setFeaturedImage = setFeaturedImage;
const prisma_1 = require("../config/prisma");
async function setFeaturedImage(tourId, imageId) {
    await prisma_1.prisma.image.updateMany({
        where: { tourId },
        data: { isFeatured: false },
    });
    await prisma_1.prisma.image.update({
        where: { id: imageId },
        data: { isFeatured: true },
    });
    return { message: 'Updated featured image' };
}
