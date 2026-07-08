"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminWarningSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const enums_1 = require("../../generated/prisma/enums");
exports.adminWarningSchema = zod_1.default.object({
    actionType: zod_1.default.enum(enums_1.AdminAction),
    message: zod_1.default.string(),
    tourId: zod_1.default.uuid().optional(),
    bookingId: zod_1.default.string().optional(),
    actorId: zod_1.default.uuid(),
    metadata: zod_1.default.any(),
    accommodationId: zod_1.default.uuid().optional(),
    unitId: zod_1.default.uuid().optional(),
    rentalId: zod_1.default.uuid().optional(),
    transferId: zod_1.default.uuid().optional(),
});
