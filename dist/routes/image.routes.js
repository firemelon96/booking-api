"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const image_controller_1 = require("../controllers/image.controller");
const router = (0, express_1.Router)({ mergeParams: true });
router.patch('/:imageId', auth_middleware_1.authenticate, role_middleware_1.requireAdmin, image_controller_1.setFeatured);
exports.default = router;
