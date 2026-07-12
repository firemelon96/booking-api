"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setFeaturedParams = exports.imageSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.imageSchema = zod_1.default.object({
    existingImageIds: zod_1.default.string().array(),
    newImageIds: zod_1.default.string().array(),
});
exports.setFeaturedParams = zod_1.default.object({
    tourId: zod_1.default.string(),
    imageId: zod_1.default.string(),
});
