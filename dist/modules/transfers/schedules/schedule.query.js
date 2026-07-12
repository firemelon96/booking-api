"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTransferSchedule = validateTransferSchedule;
const prisma_1 = require("../../../config/prisma");
async function validateTransferSchedule(transferId, scheduleId) {
    const schedule = await prisma_1.prisma.transferSchedule.findFirst({
        where: {
            id: scheduleId,
            transferId,
        },
        select: {
            id: true,
            maxPassengers: true,
        },
    });
    if (!schedule) {
        throw new Error('Invalid schedule selected');
    }
    return {
        scheduleId: schedule.id,
        maxPassengers: schedule.maxPassengers,
    };
}
