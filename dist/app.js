"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const tour_routes_1 = __importDefault(require("./routes/tour.routes"));
const pricing_routes_1 = __importDefault(require("./routes/pricing.routes"));
const booking_routes_1 = __importDefault(require("./routes/booking.routes"));
const app = (0, express_1.default)();
app.set('trust proxy', 1);
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/', (_req, res) => {
    res.send('Welcome to the Booking API 🚀');
});
app.use('/api/auth', auth_routes_1.default);
app.use('/api/tours', tour_routes_1.default);
app.use('/api/pricing', pricing_routes_1.default);
app.use('/api/bookings', booking_routes_1.default);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
exports.default = app;
