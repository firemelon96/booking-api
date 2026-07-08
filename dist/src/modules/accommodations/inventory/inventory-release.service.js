"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.releaseAccommodationInventory = releaseAccommodationInventory;
exports.releaseUnitInventory = releaseUnitInventory;
async function releaseAccommodationInventory(tx, { accommodationId, dates, units, }) {
    for (const date of dates) {
        await tx.accommodationInventory.updateMany({
            where: { accommodationId, date },
            data: {
                bookedUnits: {
                    decrement: units,
                },
            },
        });
    }
}
async function releaseUnitInventory(tx, { unitId, dates, units }) {
    for (const date of dates) {
        await tx.accommodationUnitInventory.updateMany({
            where: {
                unitId,
                date,
            },
            data: {
                bookedUnits: {
                    decrement: units,
                },
            },
        });
    }
}
