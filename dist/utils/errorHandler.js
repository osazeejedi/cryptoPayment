"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleControllerError = exports.handleError = exports.errorHandler = exports.AppError = void 0;
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const errorHandler = (err, req, res, next) => {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    }
    else {
        console.error('ERROR 💥', err);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong'
        });
    }
};
exports.errorHandler = errorHandler;
const handleError = (error, res, defaultMessage = 'An error occurred') => {
    console.error('Error:', error);
    if (error instanceof Error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
    return res.status(500).json({
        success: false,
        message: defaultMessage
    });
};
exports.handleError = handleError;
exports.handleControllerError = exports.handleError;
