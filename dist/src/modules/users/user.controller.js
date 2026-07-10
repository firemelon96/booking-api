"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUser = getAllUser;
exports.profile = profile;
const user_service_1 = require("./user.service");
const user_validation_1 = require("./user.validation");
async function getAllUser(req, res, next) {
    const payload = user_validation_1.userQuerySchema.safeParse(req.query);
    if (!payload.success) {
        throw new Error('Invalid fields');
    }
    try {
        const users = await (0, user_service_1.fetchAllUser)(payload.data);
        return res.json(users);
    }
    catch (error) {
        next(error);
    }
}
async function profile(req, res, next) {
    if (!req.user) {
        throw new Error('Unauthorized');
    }
    try {
        const profile = await (0, user_service_1.fetchProfile)(req.user.userId);
        return res.json(profile);
    }
    catch (error) {
        next(error);
    }
}
