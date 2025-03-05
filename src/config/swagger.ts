import swaggerJsdoc from 'swagger-jsdoc';
import { config } from '../../config/env';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Crypto Payment API',
      version: '1.0.0',
      description: 'API for cryptocurrency payments and transfers',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: config.app.baseUrl || 'http://localhost:3000',
        description: 'API Server',
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
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

export default specs; 