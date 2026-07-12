"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRentalItemService = createRentalItemService;
exports.updateRentalItemService = updateRentalItemService;
exports.removeRentalItemService = removeRentalItemService;
exports.createBulkRentalItemsService = createBulkRentalItemsService;
const prisma_1 = require("../../../config/prisma");
const rental_query_1 = require("../rental.query");
const rental_item_query_1 = require("./rental-item.query");
async function createRentalItemService(rentalId, { itemCode, name, pricing, description, quantity, imageIds, }) {
    const rental = await (0, rental_query_1.findRentalByIdOrFail)(rentalId);
    return prisma_1.prisma.$transaction(async () => {
        const rentalItem = await prisma_1.prisma.rentalItem.create({
            data: {
                name,
                description,
                itemCode,
                quantity,
                rentalId: rental.id,
                pricing: {
                    createMany: {
                        data: pricing.map((p) => ({
                            price: p.price,
                            pricingType: p.pricingType,
                        })),
                    },
                },
            },
        });
        if (imageIds.length > 0) {
            await prisma_1.prisma.image.updateMany({
                where: { id: { in: imageIds } },
                data: {
                    rentalItemId: rentalItem.id,
                    type: 'RENTALITEMS',
                    status: 'ACTIVE',
                },
            });
        }
    });
}
async function updateRentalItemService({ rentalId, itemId }, { itemCode, name, pricing, description, quantity }) {
    const rental = await (0, rental_query_1.findRentalByIdOrFail)(rentalId);
    const rentalItem = await (0, rental_item_query_1.findRentalItemByIdOrFail)(itemId);
    if (rentalItem.rentalId !== rental.id) {
        throw new Error('Rental item does not belong to the specified rental');
    }
    return prisma_1.prisma.$transaction(async (tx) => {
        const updatedRentalItem = await tx.rentalItem.update({
            where: { id: rentalItem.id },
            data: {
                name,
                description,
                itemCode,
                quantity,
            },
        });
        if (pricing) {
            await tx.rentalPricing.deleteMany({
                where: { rentalItemId: rentalItem.id },
            });
            await tx.rentalPricing.createMany({
                data: pricing.map((p) => ({
                    price: p.price,
                    pricingType: p.pricingType,
                    rentalItemId: rentalItem.id,
                })),
            });
        }
        return updatedRentalItem;
    });
}
async function removeRentalItemService({ rentalId, itemId, }) {
    const rental = await (0, rental_query_1.findRentalByIdOrFail)(rentalId);
    const rentalItem = await (0, rental_item_query_1.findRentalItemByIdOrFail)(itemId);
    if (rentalItem.rentalId !== rental.id) {
        throw new Error('Rental item does not belong to the specified rental');
    }
    return prisma_1.prisma.$transaction(async (tx) => {
        await tx.rentalPricing.deleteMany({
            where: { rentalItemId: rentalItem.id },
        });
        await tx.rentalItem.delete({
            where: { id: rentalItem.id },
        });
    });
}
async function createBulkRentalItemsService(rentalId, items) {
    const rental = await (0, rental_query_1.findRentalByIdOrFail)(rentalId);
    return prisma_1.prisma.$transaction(async (tx) => {
        for (const item of items) {
            const rentalItem = await tx.rentalItem.create({
                data: {
                    name: item.name,
                    description: item.description,
                    itemCode: item.itemCode,
                    quantity: item.quantity,
                    rentalId: rental.id,
                },
            });
            if (item.pricing && item.pricing.length > 0) {
                await tx.rentalPricing.createMany({
                    data: item.pricing.map((pricing) => ({
                        rentalItemId: rentalItem.id,
                        price: pricing.price,
                        pricingType: pricing.pricingType,
                    })),
                });
            }
        }
    });
}
