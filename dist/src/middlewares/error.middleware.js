"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
function errorHandler(err, req, res, next) {
    if (err instanceof zod_1.ZodError) {
        return res.status(400).json({
            type: 'VALIDATION_ERROR',
            errors: err.flatten().fieldErrors,
        });
    }
    if (err instanceof Error) {
        return res.status(500).json({
            type: 'INTERNAL_ERROR',
            message: err.message,
        });
    }
    return res.status(500).json({
        type: 'UNKNOWN_ERROR',
        message: 'Something went wrong',
    });
}
