"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
const auth_schema_1 = require("../validators/auth.schema");
const auth_service_1 = require("../services/auth.service");
async function register(req, res) {
    try {
        const data = auth_schema_1.registerSchema.parse(req.body);
        const user = await (0, auth_service_1.registerUser)(data.email, data.password);
        res.status(201).json({
            message: 'User registered successfully!',
            user: { id: user.id, email: user.email },
        });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}
async function login(req, res) {
    try {
        const data = auth_schema_1.loginSchema.parse(req.body);
        const { user, token } = await (0, auth_service_1.loginUser)(data.email, data.password);
        res.json({
            token,
            user: { id: user.id, email: user.email, role: user.role },
        });
    }
    catch (err) {
        res.status(401).json({ error: err.message });
    }
}
