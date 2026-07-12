"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const review_controller_1 = require("./review.controller");
const router = (0, express_1.Router)();
router.post('/', auth_middleware_1.authenticate, review_controller_1.reviewController);
exports.default = router;
