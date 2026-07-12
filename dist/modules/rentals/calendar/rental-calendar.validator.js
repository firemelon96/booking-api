"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rentalCalendarSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.rentalCalendarSchema = zod_1.default.object({
    itemId: zod_1.default.uuid(),
    month: zod_1.default.string().regex(/^\d{4}-\d{2}$/),
});
