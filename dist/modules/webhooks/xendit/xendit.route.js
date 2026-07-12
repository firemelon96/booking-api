"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const xendit_controller_1 = require("./xendit.controller");
const router = (0, express_1.Router)();
router.post('/', xendit_controller_1.xenditWebhook);
exports.default = router;
