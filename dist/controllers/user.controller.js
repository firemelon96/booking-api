"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUser = getUser;
exports.getUsers = getUsers;
exports.setProfile = setProfile;
const user_service_1 = require("../services/user.service");
async function getUser(req, res) {
    try {
        const id = req.params.id;
        if (Array.isArray(id)) {
            throw new Error('Invalid id params');
        }
        const user = await (0, user_service_1.getUserById)(id);
        res.json(user);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}
async function getUsers(req, res) {
    try {
        const id = req.user?.userId;
        if (!id) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const users = await (0, user_service_1.getAllUsers)(id);
        res.json(users);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}
async function setProfile(req, res) {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        if (Array.isArray(id)) {
            throw new Error('Invalid params');
        }
        const { imageId } = req.body;
        if (userId !== id) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const result = await (0, user_service_1.setProfileImage)(userId, imageId);
        res.json(result);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}
