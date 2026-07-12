"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTransferPricing = createTransferPricing;
exports.modifyTransferPricing = modifyTransferPricing;
const prisma_1 = require("../../../config/prisma");
const transfer_query_1 = require("../transfer.query");
const pricing_rule_1 = require("./pricing.rule");
async function createTransferPricing(tx, transferId, pricing) {
    return tx.transferPricing.createMany({
        data: pricing.map((p) => ({
            ...p,
            transferId,
        })),
    });
}
async function modifyTransferPricing(transferId, pricing) {
    const transfer = await (0, transfer_query_1.findTransferOrThrow)(transferId);
    (0, pricing_rule_1.validateTransferPricing)(transfer.pricingMode, pricing);
    return prisma_1.prisma.$transaction(async (tx) => {
        await tx.transferPricing.deleteMany({
            where: { transferId: transfer.id },
        });
        await tx.transferPricing.createMany({
            data: pricing.map((p) => ({
                ...p,
                transferId: transfer.id,
            })),
        });
        return { success: true, message: 'Updated pricing' };
    });
}
