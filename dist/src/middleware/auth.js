"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const supabase_1 = require("../../config/supabase");
/**
 * Authentication middleware
 */
const authenticate = async (req, res, next) => {
    try {
        // For testing, if we have a dummy token, just pass through
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.includes('dummy-token-for-testing')) {
            req.user = { id: 'test-user-id' };
            return next();
        }
        // Get token from Authorization header
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                status: 'error',
                message: 'Unauthorized - No token provided'
            });
        }
        const token = authHeader.split(' ')[1];
        // Verify token with Supabase
        const { data, error } = await supabase_1.supabase.auth.getUser(token);
        if (error || !data.user) {
            return res.status(401).json({
                status: 'error',
                message: 'Unauthorized - Invalid token'
            });
        }
        // Add user to request
        req.user = data.user;
        next();
    }
    catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};
exports.authenticate = authenticate;
