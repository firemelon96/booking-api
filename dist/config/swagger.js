"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
const path_1 = __importDefault(require("path"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const isProd = process.env.NODE_ENV === 'production';
// __dirname here is inside dist/config in production, and src/config in dev.
const apisGlob = isProd
    ? path_1.default.join(__dirname, '../routes/**/*.js') // dist/routes/**/*.js
    : path_1.default.join(__dirname, '../routes/**/*.ts'); // src/routes/**/*.ts (if running ts-node)
exports.swaggerSpec = (0, swagger_jsdoc_1.default)({
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Booking API',
            version: '1.0.0',
            description: 'REST API for tour bookings, pricing, availability, and authentication.',
        },
        servers: [
            {
                url: 'https://api.palawanwebsolutions.com',
                description: 'Production',
            },
            {
                url: 'http://localhost:4000',
                description: 'Local',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: [apisGlob], // scan route files
});
