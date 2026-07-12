"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkOverrideCapacitySchema = exports.overrideCapacitySchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.overrideCapacitySchema = zod_1.default.object({
    date: zod_1.default.coerce.date(),
    scheduleId: zod_1.default.string().optional(),
    capacity: zod_1.default.number().int().min(0),
});
exports.bulkOverrideCapacitySchema = zod_1.default.object({
    startDate: zod_1.default.coerce.date(),
    endDate: zod_1.default.coerce.date().optional(),
    scheduleId: zod_1.default.string().optional(),
    capacity: zod_1.default.number().int().min(0),
    tourId: zod_1.default.string(),
});
