"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const upload_controller_1 = require("../controllers/upload.controller");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const router = (0, express_1.Router)();
router.post('/', auth_middleware_1.authenticate, upload_middleware_1.upload.array('images', 5), upload_controller_1.uploadImage);
router.delete('/', auth_middleware_1.authenticate, role_middleware_1.requireAdmin, upload_controller_1.deleteMultiple);
// router.get('/', authenticate, requireAdmin, listImage)
exports.default = router;
