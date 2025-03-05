"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VirtualAccountController = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../../config/env");
const supabase_1 = require("../../config/supabase");
const uuid_1 = require("uuid");
const errorHandler_1 = require("../utils/errorHandler");
class VirtualAccountController {
    /**
     * Create a virtual account for a user
     */
    static async createVirtualAccount(req, res) {
        try {
            const userId = req.user.id;
            const { amount, narration, currency = 'NGN' } = req.body;
            // Validate input
            if (!amount) {
                res.status(400).json({
                    status: 'error',
                    message: 'Amount is required'
                });
                return;
            }
            // Get user details
            const { data: user, error: userError } = await supabase_1.supabase
                .from('users')
                .select('email, name, phone_number')
                .eq('id', userId)
                .single();
            if (userError || !user) {
                res.status(404).json({
                    status: 'error',
                    message: 'User not found'
                });
                return;
            }
            // Generate a unique reference
            const reference = `VA-${(0, uuid_1.v4)()}`;
            // Create virtual account request payload
            const payload = {
                reference,
                customer: {
                    name: user.name || 'Customer',
                    email: user.email
                },
                notification_url: env_1.config.payment.korapay.callbackUrl,
                amount: parseFloat(amount),
                currency,
                narration: narration || `Virtual account funding for ${user.email}`,
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days expiry
            };
            // Make API request to Korapay
            const response = await axios_1.default.post('https://api.korapay.com/merchant/api/v1/virtual-bank-account', payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${env_1.config.payment.korapay.secretKey}`
                }
            });
            // Save virtual account to database
            await supabase_1.supabase.from('virtual_accounts').insert({
                user_id: userId,
                reference,
                amount: parseFloat(amount),
                currency,
                status: 'pending',
                account_details: response.data.data,
                expires_at: payload.expires_at
            });
            res.status(200).json({
                status: 'success',
                message: 'Virtual account created successfully',
                data: {
                    reference,
                    account_details: response.data.data,
                    expires_at: payload.expires_at
                }
            });
        }
        catch (error) {
            (0, errorHandler_1.handleError)(error, res, 'Failed to create virtual account');
        }
    }
    /**
     * Get user's virtual accounts
     */
    static async getUserVirtualAccounts(req, res) {
        try {
            const userId = req.user.id;
            const { status } = req.query;
            // Build query
            let query = supabase_1.supabase
                .from('virtual_accounts')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            // Add filter by status if provided
            if (status) {
                query = query.eq('status', status);
            }
            // Execute query
            const { data: accounts, error } = await query;
            if (error) {
                res.status(500).json({
                    status: 'error',
                    message: 'Failed to fetch virtual accounts'
                });
                return;
            }
            res.status(200).json({
                status: 'success',
                data: accounts
            });
        }
        catch (error) {
            (0, errorHandler_1.handleError)(error, res, 'Failed to get user virtual accounts');
        }
    }
    /**
     * Get virtual account details
     */
    static async getVirtualAccountDetails(req, res) {
        try {
            const userId = req.user.id;
            const { reference } = req.params;
            // Get virtual account from database
            const { data: account, error } = await supabase_1.supabase
                .from('virtual_accounts')
                .select('*')
                .eq('reference', reference)
                .single();
            if (error || !account) {
                res.status(404).json({
                    status: 'error',
                    message: 'Virtual account not found'
                });
                return;
            }
            // Check if account belongs to user
            if (account.user_id !== userId) {
                res.status(403).json({
                    status: 'error',
                    message: 'Unauthorized access to virtual account'
                });
                return;
            }
            // Check account status with Korapay
            const response = await axios_1.default.get(`https://api.korapay.com/merchant/api/v1/virtual-bank-account/${reference}`, {
                headers: {
                    'Authorization': `
                }
            });
        }
        finally { }
    }
}
exports.VirtualAccountController = VirtualAccountController;
