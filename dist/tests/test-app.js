"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestApp = void 0;
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_routes_1 = __importDefault(require("../src/modules/auth/auth.routes"));
const tour_routes_1 = __importDefault(require("../src/modules/tours/tour.routes"));
const createTestApp = () => {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use((0, cookie_parser_1.default)());
    app.use('/auth', auth_routes_1.default);
    app.use('/tours', tour_routes_1.default);
    // app.use('/bookings', bookingRoutes);
    return app;
};
exports.createTestApp = createTestApp;
