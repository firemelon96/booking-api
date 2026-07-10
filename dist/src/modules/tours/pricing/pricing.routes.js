"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const role_middleware_1 = require("../../../middlewares/role.middleware");
const pricing_controller_1 = require("./pricing.controller");
const router = (0, express_1.Router)({ mergeParams: true });
router.put('/', auth_middleware_1.authenticate, role_middleware_1.requireAdmin, pricing_controller_1.replacePricing);
exports.default = router;
