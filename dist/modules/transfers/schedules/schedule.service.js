"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addSchedules = addSchedules;
exports.modifySchedules = modifySchedules;
const prisma_1 = require("../../../config/prisma");
const transfer_query_1 = require("../transfer.query");
async function addSchedules(tx, transferId, schedules) {
    await tx.transferSchedule.createMany({
        data: schedules.map((s) => ({
            ...s,
            transferId,
        })),
    });
}
async function modifySchedules(transferId, schedules) {
    const transfer = await (0, transfer_query_1.findTransferOrThrow)(transferId);
    return prisma_1.prisma.$transaction(async (tx) => {
        await tx.transferSchedule.deleteMany({
            where: {
                transferId: transfer.id,
            },
        });
        await tx.transferSchedule.createMany({
            data: schedules.map((s) => ({
                ...s,
                transferId,
            })),
        });
        return { success: true, message: 'Updated schedules' };
    });
}
