"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lockAccommodationInventory = lockAccommodationInventory;
exports.lockUnitInventory = lockUnitInventory;
async function lockAccommodationInventory(tx, { accommodationId, dates }) {
    for (const date of dates) {
        await tx.$queryRaw `
    SELECT id
    FROM "AccommodationInventory" 
    WHERE "accommodationId" = ${accommodationId} 
    AND "date" = ${date}
    FOR UPDATE
    `;
    }
}
async function lockUnitInventory(tx, { unitId, dates }) {
    for (const date of dates) {
        await tx.$queryRaw `
    SELECT id
    FROM "AccommodationUnitInventory" 
    WHERE "unitId" = ${unitId}
    AND "date" = ${date}
    FOR UPDATE
    `;
    }
}
