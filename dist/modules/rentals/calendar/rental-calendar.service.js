"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rentalItemAvailabilityService = rentalItemAvailabilityService;
const date_fns_1 = require("date-fns");
const helper_1 = require("../../../utils/helper");
const rental_item_query_1 = require("../items/rental-item.query");
const prisma_1 = require("../../../config/prisma");
async function rentalItemAvailabilityService({ itemId, month, }) {
    const rentalItem = await (0, rental_item_query_1.findRentalItemByIdOrFail)(itemId);
    const { start, end } = (0, helper_1.getMonthRange)(month);
    const days = (0, date_fns_1.eachDayOfInterval)({ start, end });
    return prisma_1.prisma.$transaction(async (tx) => {
        const rentalItemInventories = await tx.rentalInventory.findMany({
            where: {
                rentalItemId: rentalItem.id,
                date: { gte: start, lte: end },
            },
            select: {
                date: true,
                availableUnits: true,
                bookedUnits: true,
                isClosed: true,
            },
        });
        const itemMap = new Map(rentalItemInventories.map((r) => [(0, date_fns_1.startOfDay)(r.date).getTime(), r]));
        return days.map((day) => {
            const key = (0, date_fns_1.startOfDay)(day).getTime();
            const inventoryRow = itemMap.get(key);
            let status;
            let availableUnits = 0;
            let bookedUnits = 0;
            let remainingSlots = null;
            if (inventoryRow) {
                if (inventoryRow.isClosed) {
                    status = 'CLOSED';
                }
                else if (inventoryRow.bookedUnits >= inventoryRow.availableUnits) {
                    status = 'FULL';
                    availableUnits = inventoryRow.availableUnits;
                    bookedUnits = inventoryRow.bookedUnits;
                }
                else {
                    status = 'AVAILABLE';
                    availableUnits = inventoryRow.availableUnits;
                    bookedUnits = inventoryRow.bookedUnits;
                    remainingSlots =
                        inventoryRow.availableUnits - inventoryRow.bookedUnits;
                }
            }
            else {
                status = 'NO_INVENTORY';
            }
            return {
                date: day.toISOString().slice(0, 10),
                status,
                availableUnits,
                bookedUnits,
                remainingSlots,
            };
        });
    });
}
