"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findRentalItemByIdOrFail = findRentalItemByIdOrFail;
const prisma_1 = require("../../../config/prisma");
async function findRentalItemByIdOrFail(id) {
    const rentalItem = await prisma_1.prisma.rentalItem.findUnique({
        where: { id },
        include: { pricing: true },
    });
    if (!rentalItem) {
        throw new Error('Rental item not found');
    }
    return rentalItem;
}
