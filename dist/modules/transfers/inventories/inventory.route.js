"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const role_middleware_1 = require("../../../middlewares/role.middleware");
const router = (0, express_1.Router)({ mergeParams: true });
router.post('/set-inventory', auth_middleware_1.authenticate, role_middleware_1.requireAdmin);
exports.default = router;
