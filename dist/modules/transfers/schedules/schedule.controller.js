"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modifyScheduleController = modifyScheduleController;
const transfer_validator_1 = require("../transfer.validator");
const schedule_service_1 = require("./schedule.service");
const schedule_validator_1 = require("./schedule.validator");
async function modifyScheduleController(req, res, next) {
    const params = transfer_validator_1.transferIdParams.safeParse(req.params);
    if (!params.success) {
        throw new Error('Invalid params');
    }
    const payload = schedule_validator_1.transferScheduleSchema.array().safeParse(req.body);
    if (!payload.success) {
        throw new Error('Invalid params');
    }
    try {
        const modified = await (0, schedule_service_1.modifySchedules)(params.data.transferId, payload.data);
        res.json(modified);
    }
    catch (error) {
        next(error);
    }
}
