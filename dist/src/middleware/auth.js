"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateUser = void 0;
const supabase_1 = require("../../config/supabase");
const errorHandler_1 = require("../utils/errorHandler");
/**
 * Authentication middleware
 */
const authenticateUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new errorHandler_1.AppError('Not authenticated', 401);
        }
        const token = authHeader.split(' ')[1];
        // Verify token with Supabase
        const { data, error } = await supabase_1.supabase.auth.getUser(token);
        if (error || !data.user) {
            throw new errorHandler_1.AppError('Unauthorized - Invalid token', 401);
        }
        // Add user to request
        req.user = data.user;
        next();
    }
    catch (error) {
        if (error instanceof errorHandler_1.AppError) {
            res.status(error.statusCode).json({
                status: error.status,
                message: error.message
            });
        }
        else {
            console.error('Auth middleware error:', error);
            res.status(500).json({
                status: 'error',
                message: 'Authentication failed'
            });
        }
    }
};
exports.authenticateUser = authenticateUser;
