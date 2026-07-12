"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureTransferInventory = ensureTransferInventory;
exports.lockTransferInventory = lockTransferInventory;
exports.reserveSharedTransferInventory = reserveSharedTransferInventory;
exports.reservePrivateTransferInventory = reservePrivateTransferInventory;
exports.reserveTransferInventory = reserveTransferInventory;
exports.releaseTransferInventory = releaseTransferInventory;
const date_fns_1 = require("date-fns");
const admin_warning_service_1 = require("../../logs/admin-warning.service");
// export async function setInventoryService(
//   transferId: string,
//   { endDate, inventory, startDate, scheduleId }: SetInventoryInput,
// ) {
//   const transfer = await findTransferOrThrow(transferId);
//   let selectedSchedule = transfer.hasSchedule
//     ? transfer.schedules.find((s) => s.id === scheduleId)
//     : null;
//   const interval = normalizeInterval(startDate, endDate);
//   const dates = eachDayOfInterval(interval);
//   return prisma.$transaction(async (tx) => {
//     for (const date of dates) {
//       await ensureTransferInventory(tx, {
//         transferId,
//         travelDate: date,
//         maxPassengers: inventory,
//         scheduleId: selectedSchedule?.id,
//       });
//       await lockTransferInventory(tx, {
//         transferId,
//         travelDate: date,
//         scheduleId: selectedSchedule?.id,
//       });
//       await tx.transferInventory.update({
//         where: {
//           transferId,
//           date,
//         },
//         data: {
//           availableSeats: inventory,
//         },
//       });
//     }
//   });
// }
async function ensureTransferInventory(tx, { transferId, travelDate, maxPassengers, scheduleId, }) {
    await tx.transferInventory.create({
        data: {
            transferId,
            scheduleId: scheduleId ?? null,
            date: (0, date_fns_1.startOfDay)(travelDate),
            isClosed: false,
            availableSeats: maxPassengers,
            bookedSeats: 0,
        },
    });
}
async function lockTransferInventory(tx, { transferId, travelDate, scheduleId, }) {
    return tx.$queryRaw `
    SELECT id
    FROM "TransferInventory"
    WHERE "transferId" = ${transferId}
    AND "scheduleId" IS NOT DISTINCT FROM ${scheduleId ?? null}
    AND "date" = ${(0, date_fns_1.startOfDay)(travelDate)}
    FOR UPDATE`;
}
async function reserveSharedTransferInventory(tx, { transferId, scheduleId, travelDate, passengers, isAdmin, userId, }) {
    let hasOverbooking = false;
    let hasAdminOverride = false;
    const inventory = await tx.transferInventory.findFirst({
        where: {
            transferId,
            scheduleId: scheduleId ?? null,
            date: (0, date_fns_1.startOfDay)(travelDate),
        },
    });
    if (!inventory) {
        throw new Error('Transfer inventory not found');
    }
    if (inventory.isClosed) {
        if (!isAdmin) {
            throw new Error('Transfer unavailable');
        }
        hasAdminOverride = true;
        await (0, admin_warning_service_1.logAdminWarning)({
            tx,
            actionType: 'BOOKED_ON_CLOSED_DATE',
            actorId: userId,
            transferId,
            message: 'Admin booked on closed date',
            metadata: inventory,
        });
    }
    const remainingSeats = inventory.availableSeats - inventory.bookedSeats;
    if (remainingSeats < passengers) {
        if (!isAdmin) {
            throw new Error('Not enough seats available');
        }
        hasOverbooking = true;
        hasAdminOverride = true;
        await (0, admin_warning_service_1.logAdminWarning)({
            tx,
            actorId: userId,
            actionType: 'OVERBOOKING',
            transferId,
            message: `Admin overbooked transfer of ${inventory.date}`,
            metadata: { passengers, remainingSeats },
        });
    }
    await tx.transferInventory.update({
        where: {
            id: inventory.id,
        },
        data: {
            bookedSeats: {
                increment: passengers,
            },
        },
    });
    return {
        hasAdminOverride,
        hasOverbooking,
    };
}
async function reservePrivateTransferInventory(tx, { transferId, scheduleId, travelDate, isAdmin, userId, }) {
    let hasOverbooking = false;
    let hasAdminOverride = false;
    const inventory = await tx.transferInventory.findFirst({
        where: {
            transferId,
            scheduleId: scheduleId ?? null,
            date: (0, date_fns_1.startOfDay)(travelDate),
        },
    });
    if (!inventory) {
        throw new Error('Transfer inventory not found');
    }
    if (inventory.isClosed) {
        if (!isAdmin) {
            throw new Error('Transfer unavailable');
        }
        hasAdminOverride = true;
        await (0, admin_warning_service_1.logAdminWarning)({
            tx,
            actionType: 'BOOKED_ON_CLOSED_DATE',
            actorId: userId,
            transferId,
            message: 'Admin booked on closed date',
            metadata: inventory,
        });
    }
    const hasConflict = inventory.bookedSeats > 0;
    if (hasConflict) {
        if (!isAdmin) {
            throw new Error('Not enough seats available');
        }
        hasOverbooking = true;
        hasAdminOverride = true;
        await (0, admin_warning_service_1.logAdminWarning)({
            tx,
            actorId: userId,
            actionType: 'FORCED_PRIVATE',
            transferId,
            message: `Admin forced private transfer of ${inventory.date}`,
            metadata: inventory,
        });
    }
    await tx.transferInventory.update({
        where: {
            id: inventory.id,
        },
        data: {
            bookedSeats: {
                increment: inventory.availableSeats,
            },
        },
    });
    return {
        hasAdminOverride,
        hasOverbooking,
    };
}
async function reserveTransferInventory(tx, { transferId, travelDate, isAdmin, pricingType, userId, scheduleId, passengers, }) {
    switch (pricingType) {
        case 'JOINER':
            return reserveSharedTransferInventory(tx, {
                transferId,
                scheduleId,
                travelDate,
                isAdmin,
                passengers,
                userId,
            });
        case 'PRIVATE':
            return reservePrivateTransferInventory(tx, {
                transferId,
                scheduleId,
                travelDate,
                isAdmin,
                userId,
            });
        default:
            throw new Error('Invalid pricing type');
    }
}
async function releaseTransferInventory(tx, { transferId, scheduleId, travelDate, passengers, pricingType, }) {
    const inventory = await tx.transferInventory.findFirst({
        where: {
            transferId,
            scheduleId: scheduleId ?? null,
            date: (0, date_fns_1.startOfDay)(travelDate),
        },
    });
    if (!inventory) {
        return;
    }
    if (pricingType === 'PRIVATE') {
        await tx.transferInventory.update({
            where: {
                id: inventory.id,
            },
            data: {
                bookedSeats: {
                    decrement: passengers,
                },
                availableSeats: 0,
            },
        });
        return;
    }
    await tx.transferInventory.update({
        where: { id: inventory.id },
        data: {
            bookedSeats: {
                decrement: passengers,
            },
        },
    });
}
