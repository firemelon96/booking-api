"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = require("./config/swagger");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const tour_routes_1 = __importDefault(require("./routes/tour.routes"));
const pricing_routes_1 = __importDefault(require("./routes/pricing.routes"));
const booking_routes_1 = __importDefault(require("./routes/booking.routes"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
app.set('trust proxy', 1);
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/', (_req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../public/index.html'));
});
app.use('/api/auth', auth_routes_1.default);
app.use('/api/tours', tour_routes_1.default);
app.use('/api/pricing', pricing_routes_1.default);
app.use('/api/bookings', booking_routes_1.default);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec));
exports.default = app;
