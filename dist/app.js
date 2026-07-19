"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = require("./config/swagger");
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const tour_routes_1 = __importDefault(require("./modules/tours/tour.routes"));
const booking_route_1 = __importDefault(require("./modules/bookings/booking.route"));
const xendit_route_1 = __importDefault(require("./modules/webhooks/xendit/xendit.route"));
const user_route_1 = __importDefault(require("./modules/users/user.route"));
const amenity_route_1 = __importDefault(require("./modules/amenity/amenity.route"));
const accommodation_route_1 = __importDefault(require("./modules/accommodations/accommodation.route"));
const transfer_route_1 = __importDefault(require("./modules/transfers/transfer.route"));
const location_route_1 = __importDefault(require("./modules/locations/location.route"));
const rental_route_1 = __importDefault(require("./modules/rentals/rental.route"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const error_middleware_1 = require("./middlewares/error.middleware");
const app = (0, express_1.default)();
app.set('trust proxy', 1);
const allowedOrigins = ['http://localhost:3000'];
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        // Allow requests without an Origin (e.g. Postman)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.get('/', (_req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../public/index.html'));
});
//auth routes i.e. login, register
app.use('/api/auth', auth_routes_1.default);
//public routes
app.use('/api/users', user_route_1.default);
app.use('/api/bookings', booking_route_1.default);
//authorized routes
app.use('/api/tours', tour_routes_1.default);
app.use('/api/accommodations', accommodation_route_1.default);
app.use('/api/transfers', transfer_route_1.default);
app.use('/api/rentals', rental_route_1.default);
app.use('/api/webhook', xendit_route_1.default);
app.use('/api/amenity', amenity_route_1.default);
app.use('/api/locations', location_route_1.default);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec));
app.use(error_middleware_1.errorHandler);
exports.default = app;
