"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findLocationOrFail = findLocationOrFail;
const prisma_1 = require("../../config/prisma");
async function findLocationOrFail(locationId) {
    const existing = await prisma_1.prisma.transferLocation.findUnique({
        where: {
            id: locationId,
        },
    });
    if (!existing) {
        throw new Error('Location not found');
    }
    return existing;
}
