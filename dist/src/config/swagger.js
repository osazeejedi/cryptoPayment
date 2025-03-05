"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const env_1 = require("../../config/env");
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
                url: env_1.config.app.baseUrl || 'http://localhost:3000',
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
        path_1.default.resolve(__dirname, '../routes/*.ts'),
        path_1.default.resolve(__dirname, '../controllers/*.ts')
    ],
};
const specs = (0, swagger_jsdoc_1.default)(options);
exports.default = specs;
