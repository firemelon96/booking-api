"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureRentalInventory = ensureRentalInventory;
exports.lockRentalInventory = lockRentalInventory;
exports.reserveRentalInventory = reserveRentalInventory;
exports.releaseRentalInventory = releaseRentalInventory;
const admin_warning_service_1 = require("../../logs/admin-warning.service");
async function ensureRentalInventory(tx, { itemId, dates, quantity, }) {
    return tx.rentalInventory.createMany({
        data: dates.map((date) => ({
            rentalItemId: itemId,
            date,
            availableUnits: quantity,
            bookedUnits: 0,
        })),
        skipDuplicates: true,
    });
}
async function lockRentalInventory(tx, { itemId, dates }) {
    for (const date of dates) {
        await tx.$queryRaw `
    SELECT id
    FROM "RentalInventory"
    WHERE "rentalItemId" = ${itemId}
    AND "date" = ${date}
    FOR UPDATE
    `;
    }
}
async function reserveRentalInventory(tx, { itemId, dates, isAdmin, userId, quantity, }) {
    let hasOverbooking = false;
    let hasAdminOverride = false;
    for (const date of dates) {
        const row = await tx.rentalInventory.findFirst({
            where: {
                rentalItemId: itemId,
                date,
            },
        });
        if (!row) {
            throw new Error('Item inventory not found');
        }
        if (row.isClosed) {
            if (!isAdmin) {
                throw new Error('Date is closed');
            }
            hasAdminOverride = true;
            //log warning
            await (0, admin_warning_service_1.logAdminWarning)({
                tx,
                actionType: 'BOOKED_ON_CLOSED_DATE',
                message: `Admin booked on closed date ${row.date}`,
                actorId: userId,
                metadata: row,
            });
        }
        const remaining = row.availableUnits - row.bookedUnits;
        if (remaining < quantity) {
            if (!isAdmin) {
                throw new Error('Item is not available');
            }
            hasAdminOverride = true;
            hasOverbooking = true;
            //log warning
            await (0, admin_warning_service_1.logAdminWarning)({
                tx,
                actionType: 'OVERBOOKING',
                message: `Admin overbooked on ${row.date}`,
                actorId: userId,
                metadata: row,
            });
        }
        await tx.rentalInventory.update({
            where: {
                id: row.id,
            },
            data: {
                bookedUnits: {
                    increment: quantity,
                },
            },
        });
    }
    return {
        hasAdminOverride,
        hasOverbooking,
    };
}
async function releaseRentalInventory(tx, { itemId, dates, quantity, }) {
    for (const date of dates) {
        await tx.rentalInventory.updateMany({
            where: {
                rentalItemId: itemId,
                date,
            },
            data: {
                bookedUnits: {
                    decrement: quantity,
                },
            },
        });
    }
}
