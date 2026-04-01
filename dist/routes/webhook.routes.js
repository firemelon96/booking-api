"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const webhook_controller_1 = require("../controllers/webhook.controller");
const router = (0, express_1.Router)();
router.post('/xendit', auth_middleware_1.authenticate, webhook_controller_1.xenditWebhook);
exports.default = router;
