"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transferPricingSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const enums_1 = require("../../../generated/prisma/enums");
exports.transferPricingSchema = zod_1.default.object({
    pricingType: zod_1.default.enum(enums_1.PricingType),
    price: zod_1.default.number(),
    minPassengers: zod_1.default.number(),
    maxPassengers: zod_1.default.number(),
});
