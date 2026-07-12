"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const calendar_controller_1 = require("./calendar.controller");
const router = (0, express_1.Router)({ mergeParams: true });
router.get('/', auth_middleware_1.authenticate, calendar_controller_1.getAccommodationCalendarController);
exports.default = router;
