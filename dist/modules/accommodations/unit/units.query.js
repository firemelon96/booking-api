"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUnitOrFail = findUnitOrFail;
const prisma_1 = require("../../../config/prisma");
async function findUnitOrFail(unitId) {
    const unitExist = await prisma_1.prisma.accommodationUnit.findUnique({
        where: { id: unitId },
    });
    if (!unitExist) {
        throw new Error('Unit does not exist');
    }
    return unitExist;
}
