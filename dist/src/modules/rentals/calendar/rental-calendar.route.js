"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rental_calendar_controller_1 = require("./rental-calendar.controller");
const router = (0, express_1.Router)({ mergeParams: true });
router.get('/', rental_calendar_controller_1.rentalItemCalendarAvailability);
exports.default = router;
