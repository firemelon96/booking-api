"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const accommodation_booking_controller_1 = require("./accommodation-booking.controller");
const router = (0, express_1.Router)({ mergeParams: true });
router.post('/', auth_middleware_1.authenticate, accommodation_booking_controller_1.createBookingController);
exports.default = router;
