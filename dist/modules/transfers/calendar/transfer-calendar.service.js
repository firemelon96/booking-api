"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransferCalendarService = getTransferCalendarService;
const date_fns_1 = require("date-fns");
const helper_1 = require("../../../utils/helper");
const transfer_query_1 = require("../transfer.query");
const prisma_1 = require("../../../config/prisma");
async function getTransferCalendarService(slug, { month, scheduleId }) {
    const transfer = await (0, transfer_query_1.findTransferBySlugOrFail)(slug);
    const { start, end } = (0, helper_1.getMonthRange)(month);
    const days = (0, date_fns_1.eachDayOfInterval)({ start, end });
    if (transfer.hasSchedule && !scheduleId) {
        throw new Error('Schedule must be selected');
    }
    if (!transfer.hasSchedule && scheduleId) {
        throw new Error('Schedule not required');
    }
    return prisma_1.prisma.$transaction(async (tx) => {
        const inventories = await tx.transferInventory.findMany({
            where: {
                transferId: transfer.id,
                scheduleId,
                date: { gte: start, lte: end },
            },
            select: {
                date: true,
                availableSeats: true,
                bookedSeats: true,
                isClosed: true,
            },
        });
        const inventoryMap = new Map(inventories.map((i) => [i.date.getTime(), i]));
        return days.map((d) => {
            const key = (0, date_fns_1.startOfDay)(d).getTime();
            const inventoryRow = inventoryMap.get(key);
            let status;
            let availableSlots = 0;
            let bookedSlots = 0;
            let remainingSlots = null;
            if (inventoryRow) {
                if (inventoryRow.isClosed) {
                    status = 'CLOSED';
                }
                else if (inventoryRow.bookedSeats >= inventoryRow.availableSeats) {
                    status = 'FULL';
                    availableSlots = inventoryRow.availableSeats;
                    bookedSlots = inventoryRow.bookedSeats;
                }
                else {
                    status = 'AVAILABLE';
                    availableSlots = inventoryRow.availableSeats;
                    bookedSlots = inventoryRow.bookedSeats;
                    remainingSlots =
                        inventoryRow.availableSeats - inventoryRow.bookedSeats;
                }
            }
            else {
                status = 'NO_INVENTORY';
            }
            return {
                date: d.toISOString().slice(0, 10),
                status,
                availableSlots,
                bookedSlots,
                remainingSlots,
            };
        });
    });
}
