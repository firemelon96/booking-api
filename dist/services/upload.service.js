"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImageService = uploadImageService;
const prisma_1 = require("../config/prisma");
async function uploadImageService(files, type) {
    return Promise.all(files.map((file) => prisma_1.prisma.image.create({
        data: {
            url: file.path,
            publicId: file.filename,
            type: type || 'TOUR',
            status: 'TEMP',
        },
    })));
}
