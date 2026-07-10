"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.blockDatesSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.blockDatesSchema = zod_1.default.object({
    startDate: zod_1.default.coerce.date(),
    endDate: zod_1.default.coerce.date().optional(),
    reason: zod_1.default.string().optional(),
});
