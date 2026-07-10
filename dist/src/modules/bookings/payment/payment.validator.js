"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInitialPaymentTransaction = exports.createAccommodationSchema = exports.createPaymentSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const enums_1 = require("../../../generated/prisma/enums");
exports.createPaymentSchema = zod_1.default.object({
    bookingId: zod_1.default.string(),
    userId: zod_1.default.string(),
});
exports.createAccommodationSchema = zod_1.default.object({
    accommodationId: zod_1.default.string(),
    userId: zod_1.default.string(),
    unitId: zod_1.default.string().optional(),
});
exports.createInitialPaymentTransaction = zod_1.default.object({
    bookingId: zod_1.default.string(),
    type: zod_1.default.enum(enums_1.TransactionType),
    amount: zod_1.default.number(),
    xenditInvoiceId: zod_1.default.string().optional(),
    invoiceUrl: zod_1.default.string().optional(),
    expiresAt: zod_1.default.date().optional(),
    description: zod_1.default.string().optional(),
});
