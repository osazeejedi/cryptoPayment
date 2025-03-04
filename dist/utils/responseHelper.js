"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendError = exports.sendSuccess = void 0;
const sendSuccess = (res, data, message = 'Success') => {
    return res.status(200).json({
        success: true,
        status: 'success',
        message,
        data
    });
};
exports.sendSuccess = sendSuccess;
const sendError = (res, message, status = 400) => {
    return res.status(status).json({
        success: false,
        status: 'error',
        message
    });
};
exports.sendError = sendError;
