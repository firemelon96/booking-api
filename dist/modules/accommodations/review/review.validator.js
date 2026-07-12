"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReviewSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.createReviewSchema = zod_1.default.object({
    unitId: zod_1.default.string(),
    comment: zod_1.default.string().min(2),
    starRating: zod_1.default.number(),
    imageIds: zod_1.default.string().array(),
});
