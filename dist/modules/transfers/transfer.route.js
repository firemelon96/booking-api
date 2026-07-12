"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const transfer_controller_1 = require("./transfer.controller");
const booking_route_1 = __importDefault(require("./bookings/booking.route"));
const pricing_route_1 = __importDefault(require("./pricings/pricing.route"));
const schedule_route_1 = __importDefault(require("./schedules/schedule.route"));
const transfer_calendar_route_1 = __importDefault(require("./calendar/transfer-calendar.route"));
const like_route_1 = __importDefault(require("./like/like.route"));
const image_route_1 = __importDefault(require("./images/image.route"));
const router = (0, express_1.Router)({ mergeParams: true });
//public
router.get('/', transfer_controller_1.getAllTransferController);
router.get('/:slug', transfer_controller_1.getTransferBySlugController);
router.use('/:slug/calendar', transfer_calendar_route_1.default);
//admin
router.post('/', auth_middleware_1.authenticate, role_middleware_1.requireAdmin, transfer_controller_1.createTransferController);
router.patch('/:transferId', auth_middleware_1.authenticate, role_middleware_1.requireAdmin, transfer_controller_1.updateTransferController);
router.delete('/:transferId', auth_middleware_1.authenticate, role_middleware_1.requireAdmin, transfer_controller_1.removeTransferController);
router.use('/:transferId/pricings', pricing_route_1.default);
router.use('/:transferId/schedules', schedule_route_1.default);
router.use('/:transferId/images', image_route_1.default);
//loggedin user
router.use('/:transferId/bookings', booking_route_1.default);
router.use('/:transferId/like', like_route_1.default);
exports.default = router;
