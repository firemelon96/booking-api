"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const amenity_controller_1 = require("./amenity.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const router = (0, express_1.Router)();
router.get('/', amenity_controller_1.getAmenities);
router.post('/', auth_middleware_1.authenticate, role_middleware_1.requireAdmin, amenity_controller_1.createAmenity);
// router.get('/:amenityId');
// TODO: Create the delete, update
exports.default = router;
