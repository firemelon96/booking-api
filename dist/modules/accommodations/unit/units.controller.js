"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUnit = createUnit;
exports.updateUnit = updateUnit;
exports.getUnits = getUnits;
exports.removeUnit = removeUnit;
const units_validator_1 = require("./units.validator");
const units_service_1 = require("./units.service");
async function createUnit(req, res, next) {
    const { accommodationId } = req.params;
    if (Array.isArray(accommodationId)) {
        throw new Error('Invalid params');
    }
    const input = {
        accommodationId,
        ...req.body,
    };
    const payload = units_validator_1.createUnitSchema.safeParse(input);
    if (!payload.success) {
        throw new Error('Invalid fields');
    }
    try {
        const created = await (0, units_service_1.createdUnit)(accommodationId, payload.data);
        res.json(created);
    }
    catch (error) {
        next(error);
    }
}
async function updateUnit(req, res, next) {
    const { accommodationId } = req.params;
    const { unitId } = req.params;
    if (Array.isArray(accommodationId) || Array.isArray(unitId)) {
        throw new Error('Invalid params');
    }
    const payload = units_validator_1.createUnitSchema.safeParse(req.body);
    if (!payload.success) {
        throw new Error('Invalid fields');
    }
    try {
        const updated = await (0, units_service_1.updatedUnit)(accommodationId, unitId, payload.data);
        res.json(updated);
    }
    catch (error) {
        next(error);
    }
}
async function getUnits(req, res, next) {
    const input = {
        accommodationId: req.params.accommodationId,
        ...req.query,
    };
    const payload = units_validator_1.unitQuerySchema.safeParse(input);
    if (!payload.success) {
        throw new Error('Invalid fields');
    }
    try {
        const units = await (0, units_service_1.listUnits)(payload.data);
        res.json(units);
    }
    catch (error) {
        next(error);
    }
}
async function removeUnit(req, res, next) {
    const { accommodationId } = req.params;
    const { unitId } = req.params;
    if (Array.isArray(accommodationId) || Array.isArray(unitId)) {
        throw new Error('Invalid params');
    }
    try {
        await (0, units_service_1.deleteUnit)(accommodationId, unitId);
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
}
