"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
const token_service_1 = require("../modules/auth/token/token.service");
function authenticate(req, res, next) {
    const token = req.cookies?.accessToken;
    if (!token)
        return res.status(401).json({ error: 'Unauthorized' });
    try {
        const decoded = (0, token_service_1.verifyAccessToken)(token);
        req.user = decoded;
        next();
    }
    catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}
