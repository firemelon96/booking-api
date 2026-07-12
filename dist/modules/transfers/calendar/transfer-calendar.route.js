"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const transfer_calendar_controller_1 = require("./transfer-calendar.controller");
const router = (0, express_1.Router)({ mergeParams: true });
router.get('/', transfer_calendar_controller_1.getTransferCalendarController);
exports.default = router;
