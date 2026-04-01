"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const itinerary_controller_1 = require("../controllers/itinerary.controller");
const router = (0, express_1.Router)({ mergeParams: true });
router.post('/create', auth_middleware_1.authenticate, role_middleware_1.requireAdmin, itinerary_controller_1.addItineraryCtrl);
exports.default = router;
