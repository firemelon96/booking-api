"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calendarQuerySchema = exports.slugParams = void 0;
const zod_1 = __importDefault(require("zod"));
exports.slugParams = zod_1.default.object({
    slug: zod_1.default.string(),
});
exports.calendarQuerySchema = zod_1.default.object({
    month: zod_1.default.string().regex(/^\d{4}-\d{2}$/),
    accommodationId: zod_1.default.uuid(),
    unitId: zod_1.default.uuid().optional(),
});
