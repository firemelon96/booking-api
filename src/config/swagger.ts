import path from 'path';
import swaggerJSDoc from 'swagger-jsdoc';

const isProd = process.env.NODE_ENV === 'production';

// __dirname here is inside dist/config in production, and src/config in dev.
const apisGlob = isProd
  ? path.join(__dirname, '../routes/**/*.js') // dist/routes/**/*.js
  : path.join(__dirname, '../routes/**/*.ts'); // src/routes/**/*.ts (if running ts-node)

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Booking API',
      version: '1.0.0',
      description:
        'REST API for tour bookings, pricing, availability, and authentication.',
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
