"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const role_middleware_1 = require("../../../middlewares/role.middleware");
const schedule_controller_1 = require("../schedules/schedule.controller");
const router = (0, express_1.Router)({ mergeParams: true });
router.post('/', auth_middleware_1.authenticate, role_middleware_1.requireAdmin, schedule_controller_1.modifyScheduleController);
exports.default = router;
