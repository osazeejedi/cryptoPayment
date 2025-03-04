"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentServiceError = exports.PriceServiceError = exports.DatabaseError = exports.BlockchainError = exports.ServiceError = void 0;
exports.handleServiceError = handleServiceError;
// Define custom error types for better error handling
class ServiceError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ServiceError';
    }
}
exports.ServiceError = ServiceError;
class BlockchainError extends ServiceError {
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = 'BlockchainError';
    }
}
exports.BlockchainError = BlockchainError;
class DatabaseError extends ServiceError {
    constructor(message) {
        super(message);
        this.name = 'DatabaseError';
    }
}
exports.DatabaseError = DatabaseError;
class PriceServiceError extends ServiceError {
    constructor(message) {
        super(message);
        this.name = 'PriceServiceError';
    }
}
exports.PriceServiceError = PriceServiceError;
class PaymentServiceError extends ServiceError {
    constructor(message) {
        super(message);
        this.name = 'PaymentServiceError';
    }
}
exports.PaymentServiceError = PaymentServiceError;
// Error handler function specific to each service
function handleServiceError(error, service) {
    if (error instanceof ServiceError) {
        return error;
    }
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`[${service}] Error:`, error);
    switch (service) {
        case 'blockchain':
            return new BlockchainError(`Blockchain operation failed: ${message}`);
        case 'database':
            return new DatabaseError(`Database operation failed: ${message}`);
        case 'price':
            return new PriceServiceError(`Price service failed: ${message}`);
        case 'payment':
            return new PaymentServiceError(`Payment operation failed: ${message}`);
        default:
            return new ServiceError(`Service operation failed: ${message}`);
    }
}
