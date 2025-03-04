// Set up error monitoring and logging
import winston from 'winston';
import { config } from '../../config/env';

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
  const env = config.server.nodeEnv || 'development';
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
winston.addColors(colors);

// Define the format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define where to store logs
const transports = [
  // Console logs
  new winston.transports.Console(),
  
  // Error logs
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
  }),
  
  // All logs
  new winston.transports.File({ filename: 'logs/all.log' }),
  
  // Blockchain logs
  new winston.transports.File({
    filename: 'logs/blockchain.log',
    level: 'info',
  }),
  
  // Webhook logs
  new winston.transports.File({
    filename: 'logs/webhook.log',
    level: 'info',
  }),
];

// Create the logger
export const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});

// Export a blockchain-specific logger
export const blockchainLogger = {
  info: (message: string) => {
    logger.info(`[BLOCKCHAIN] ${message}`);
  },
  error: (message: string, error?: any) => {
    const errorMsg = error ? `${message}: ${error.message || error}` : message;
    logger.error(`[BLOCKCHAIN] ${errorMsg}`);
  },
  warn: (message: string) => {
    logger.warn(`[BLOCKCHAIN] ${message}`);
  },
  debug: (message: string) => {
    logger.debug(`[BLOCKCHAIN] ${message}`);
  },
};

// Export a webhook-specific logger
export const webhookLogger = {
  info: (message: string) => {
    logger.info(`[WEBHOOK] ${message}`);
  },
  error: (message: string, error?: any) => {
    const errorMsg = error ? `${message}: ${error.message || error}` : message;
    logger.error(`[WEBHOOK] ${errorMsg}`);
  },
  debug: (message: string, data?: any) => {
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    logger.debug(`[WEBHOOK] ${message}${dataStr}`);
  },
}; 