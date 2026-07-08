"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transferCalendarQuerySchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.transferCalendarQuerySchema = zod_1.default.object({
    month: zod_1.default.string().regex(/^\d{4}-\d{2}$/),
    scheduleId: zod_1.default.string().optional(),
});
