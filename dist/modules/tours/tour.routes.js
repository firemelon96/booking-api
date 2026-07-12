"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const tour_controller_1 = require("./tour.controller");
const itinerary_routes_1 = __importDefault(require("../tours/itinerary/itinerary.routes"));
const pricing_routes_1 = __importDefault(require("../tours/pricing/pricing.routes"));
const image_routes_1 = __importDefault(require("../tours/images/image.routes"));
const capacity_routes_1 = __importDefault(require("./capacity/capacity.routes"));
const tour_booking_route_1 = __importDefault(require("./booking/tour-booking.route"));
const availability_routes_1 = __importDefault(require("./availability/availability.routes"));
const calendar_route_1 = __importDefault(require("./calendar/calendar.route"));
const like_route_1 = __importDefault(require("./like/like.route"));
const review_route_1 = __importDefault(require("./review/review.route"));
const cancellation_route_1 = __importDefault(require("./cancellation-policy/cancellation.route"));
const router = (0, express_1.Router)();
//public
router.get('/', tour_controller_1.getAllTours);
router.get('/:slug', tour_controller_1.getTourDetail);
router.use('/:slug/calendar', calendar_route_1.default);
//admin crud operation
router.post('/', auth_middleware_1.authenticate, role_middleware_1.requireAdmin, tour_controller_1.addTour);
router.patch('/:id', auth_middleware_1.authenticate, role_middleware_1.requireAdmin, tour_controller_1.editBaseTour);
router.delete('/:id', auth_middleware_1.authenticate, role_middleware_1.requireAdmin, tour_controller_1.removeTour);
router.use('/:tourId/itinerary', itinerary_routes_1.default);
router.use('/:tourId/pricing', pricing_routes_1.default);
router.use('/:tourId/images', image_routes_1.default);
router.use('/:tourId/capacity', capacity_routes_1.default);
router.use('/:tourId/availability', availability_routes_1.default);
router.use('/:tourId/cancellation-policy', cancellation_route_1.default);
//auth user
router.use('/:tourId/like', like_route_1.default);
router.use('/:tourId/booking', tour_booking_route_1.default);
router.use('/:tourId/review', review_route_1.default);
exports.default = router;
