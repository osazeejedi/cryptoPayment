import path from 'path';
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
  apis: [
    path.resolve(__dirname, '../routes/*.ts'),
    path.resolve(__dirname, '../controllers/*.ts')
  ],
};

const specs = swaggerJsdoc(options);

export default specs; 