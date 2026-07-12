"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findRentalBySlugOrFail = findRentalBySlugOrFail;
exports.throwExistingRentalBySlug = throwExistingRentalBySlug;
exports.findRentalByIdOrFail = findRentalByIdOrFail;
const prisma_1 = require("../../config/prisma");
async function findRentalBySlugOrFail(slug) {
    const rental = await prisma_1.prisma.rental.findUnique({ where: { slug } });
    if (!rental) {
        throw new Error('Rental not found');
    }
    return rental;
}
async function throwExistingRentalBySlug(slug) {
    const exist = await prisma_1.prisma.rental.findUnique({ where: { slug } });
    if (exist) {
        throw new Error('Rental with the same name already exists');
    }
    return exist;
}
async function findRentalByIdOrFail(id) {
    const rental = await prisma_1.prisma.rental.findUnique({ where: { id } });
    if (!rental) {
        throw new Error('Rental not found');
    }
    return rental;
}
