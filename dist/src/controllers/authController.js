"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const supabase_1 = require("../../config/supabase");
class AuthController {
    /**
     * Register a new user
     */
    static async register(req, res) {
        try {
            const { email, password, name } = req.body;
            if (!email || !password) {
                res.status(400).json({
                    status: 'error',
                    message: 'Email and password are required'
                });
                return;
            }
            // Use Supabase Auth to register the user
            const { data: authData, error: authError } = await supabase_1.supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name || email.split('@')[0]
                    }
                }
            });
            if (authError) {
                console.error('Error registering user with Supabase Auth:', authError);
                res.status(500).json({
                    status: 'error',
                    message: authError.message
                });
                return;
            }
            // Return user data
            res.status(201).json({
                status: 'success',
                data: {
                    user: {
                        id: authData.user?.id || '',
                        email: authData.user?.email || '',
                        full_name: authData.user?.user_metadata?.full_name || ''
                    },
                    token: authData.session?.access_token || 'dummy-token-for-testing'
                }
            });
        }
        catch (error) {
            console.error('Error registering user:', error);
            res.status(500).json({
                status: 'error',
                message: error instanceof Error ? error.message : 'Failed to register user'
            });
        }
    }
    /**
     * Login user
     */
    static async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                res.status(400).json({
                    status: 'error',
                    message: 'Email and password are required'
                });
                return;
            }
            // Use Supabase Auth to login
            const { data: authData, error: authError } = await supabase_1.supabase.auth.signInWithPassword({
                email,
                password
            });
            if (authError) {
                console.error('Error logging in with Supabase Auth:', authError);
                res.status(401).json({
                    status: 'error',
                    message: 'Invalid credentials'
                });
                return;
            }
            // Return user data
            res.status(200).json({
                status: 'success',
                data: {
                    user: {
                        id: authData.user?.id || '',
                        email: authData.user?.email || '',
                        full_name: authData.user?.user_metadata?.full_name || ''
                    },
                    token: authData.session?.access_token || ''
                }
            });
        }
        catch (error) {
            console.error('Error logging in:', error);
            res.status(500).json({
                status: 'error',
                message: error instanceof Error ? error.message : 'Failed to login'
            });
        }
    }
}
exports.AuthController = AuthController;
