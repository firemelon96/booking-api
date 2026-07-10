"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const like_controller_1 = require("./like.controller");
const router = (0, express_1.Router)({ mergeParams: true });
router.post('/', auth_middleware_1.authenticate, like_controller_1.likeTransferController);
router.delete('/', auth_middleware_1.authenticate, like_controller_1.unlikeTransferController);
exports.default = router;
