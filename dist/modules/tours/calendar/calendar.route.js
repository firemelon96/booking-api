"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const calendar_controller_1 = require("./calendar.controller");
const router = (0, express_1.Router)({ mergeParams: true });
router.get('/', calendar_controller_1.getCalendarAvailability);
exports.default = router;
