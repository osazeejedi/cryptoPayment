"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookLogger = exports.blockchainLogger = exports.logger = void 0;
// Set up error monitoring and logging
const winston_1 = __importDefault(require("winston"));
const env_1 = require("../../config/env");
// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};
// Define log level based on environment
const level = () => {
    const env = env_1.config.server.nodeEnv || 'development';
    return env === 'development' ? 'debug' : 'warn';
};
// Define colors for each level
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};
// Add colors to winston
winston_1.default.addColors(colors);
// Define the format for logs
const format = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston_1.default.format.colorize({ all: true }), winston_1.default.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`));
// Define where to store logs
const transports = [
    // Console logs
    new winston_1.default.transports.Console(),
    // Error logs
    new winston_1.default.transports.File({
        filename: 'logs/error.log',
        level: 'error',
    }),
    // All logs
    new winston_1.default.transports.File({ filename: 'logs/all.log' }),
    // Blockchain logs
    new winston_1.default.transports.File({
        filename: 'logs/blockchain.log',
        level: 'info',
    }),
    // Webhook logs
    new winston_1.default.transports.File({
        filename: 'logs/webhook.log',
        level: 'info',
    }),
];
// Create the logger
exports.logger = winston_1.default.createLogger({
    level: level(),
    levels,
    format,
    transports,
});
// Export a blockchain-specific logger
exports.blockchainLogger = {
    info: (message) => {
        exports.logger.info(`[BLOCKCHAIN] ${message}`);
    },
    error: (message, error) => {
        const errorMsg = error ? `${message}: ${error.message || error}` : message;
        exports.logger.error(`[BLOCKCHAIN] ${errorMsg}`);
    },
    warn: (message) => {
        exports.logger.warn(`[BLOCKCHAIN] ${message}`);
    },
    debug: (message) => {
        exports.logger.debug(`[BLOCKCHAIN] ${message}`);
    },
};
// Export a webhook-specific logger
exports.webhookLogger = {
    info: (message) => {
        exports.logger.info(`[WEBHOOK] ${message}`);
    },
    error: (message, error) => {
        const errorMsg = error ? `${message}: ${error.message || error}` : message;
        exports.logger.error(`[WEBHOOK] ${errorMsg}`);
    },
    debug: (message, data) => {
        const dataStr = data ? ` ${JSON.stringify(data)}` : '';
        exports.logger.debug(`[WEBHOOK] ${message}${dataStr}`);
    },
};
