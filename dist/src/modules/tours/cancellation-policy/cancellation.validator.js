"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancellationPolicySchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.cancellationPolicySchema = zod_1.default.object({
    description: zod_1.default.string().optional(),
    fullRefundHours: zod_1.default.number().min(1),
    partialRefundHours: zod_1.default.number().min(1),
    partialRefundPercentage: zod_1.default.number().min(1),
    tourId: zod_1.default.uuid(),
});
