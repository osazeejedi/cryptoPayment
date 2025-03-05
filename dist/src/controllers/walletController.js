"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletController = void 0;
const blockchainService_1 = require("../services/blockchainService");
const supabase_1 = require("../../config/supabase");
const errorHandler_1 = require("../utils/errorHandler");
class WalletController {
    /**
     * Get user's wallet information
     */
    static async getUserWallet(req, res) {
        try {
            const userId = req.user.id;
            // Get wallet from database
            const { data: wallet, error } = await supabase_1.supabase
                .from('wallets')
                .select('address, created_at')
                .eq('user_id', userId)
                .single();
            if (error || !wallet) {
                res.status(404).json({
                    status: 'error',
                    message: 'Wallet not found for this user'
                });
                return;
            }
            // Get wallet balance
            const ethBalance = await blockchainService_1.BlockchainService.getBalance(wallet.address, 'ETH');
            const btcBalance = await blockchainService_1.BlockchainService.getBalance(wallet.address, 'BTC');
            res.status(200).json({
                status: 'success',
                data: {
                    address: wallet.address,
                    created_at: wallet.created_at,
                    balances: {
                        ETH: ethBalance,
                        BTC: btcBalance
                    }
                }
            });
        }
        catch (error) {
            (0, errorHandler_1.handleError)(error, res, 'Failed to get user wallet');
        }
    }
    /**
     * Get wallet balance
     */
    static async getWalletBalance(req, res) {
        try {
            const { address } = req.params;
            if (!address) {
                res.status(400).json({
                    status: 'error',
                    message: 'Wallet address is required'
                });
                return;
            }
            // Get balance using the blockchain service
            const balance = await blockchainService_1.BlockchainService.getWalletBalance(address, 'ETH');
            res.status(200).json({
                status: 'success',
                data: {
                    address,
                    balance
                }
            });
        }
        catch (error) {
            console.error('Error getting wallet balance:', error);
            res.status(500).json({
                status: 'error',
                message: error instanceof Error ? error.message : 'Failed to get balance'
            });
        }
    }
    /**
     * Get user's wallet private key (SECURITY SENSITIVE)
     * This should be protected with additional authentication
     */
    static async getWalletPrivateKey(req, res) {
        try {
            const userId = req.user.id;
            // Additional security check - require password confirmation
            const { password } = req.body;
            if (!password) {
                res.status(400).json({
                    status: 'error',
                    message: 'Password confirmation required'
                });
                return;
            }
            // Verify password
            const { data: user, error: userError } = await supabase_1.supabase
                .from('users')
                .select('password_hash')
                .eq('id', userId)
                .single();
            if (userError || !user) {
                res.status(401).json({
                    status: 'error',
                    message: 'Authentication failed'
                });
                return;
            }
            // Verify password (implement your password verification logic)
            const isPasswordValid = await verifyPassword(password, user.password_hash);
            if (!isPasswordValid) {
                res.status(401).json({
                    status: 'error',
                    message: 'Invalid password'
                });
                return;
            }
            // Get wallet from database
            const { data: wallet, error } = await supabase_1.supabase
                .from('wallets')
                .select('private_key')
                .eq('user_id', userId)
                .single();
            if (error || !wallet) {
                res.status(404).json({
                    status: 'error',
                    message: 'Wallet not found for this user'
                });
                return;
            }
            res.status(200).json({
                status: 'success',
                data: {
                    private_key: wallet.private_key
                }
            });
        }
        catch (error) {
            (0, errorHandler_1.handleError)(error, res, 'Failed to get wallet private key');
        }
    }
    /**
     * Get user's transaction history
     */
    static async getUserTransactions(req, res) {
        try {
            const userId = req.user.id;
            const { page = 1, limit = 10, type } = req.query;
            // Calculate offset for pagination
            const offset = (Number(page) - 1) * Number(limit);
            // Build query
            let query = supabase_1.supabase
                .from('transactions')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .range(offset, offset + Number(limit) - 1);
            // Add filter by transaction type if provided
            if (type) {
                query = query.eq('transaction_type', type);
            }
            // Execute query
            const { data: transactions, error, count } = await query;
            if (error) {
                res.status(500).json({
                    status: 'error',
                    message: 'Failed to fetch transactions'
                });
                return;
            }
            // Get total count for pagination
            const { count: totalCount } = await supabase_1.supabase
                .from('transactions')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);
            res.status(200).json({
                status: 'success',
                data: {
                    transactions,
                    pagination: {
                        total: totalCount || 0,
                        page: Number(page),
                        limit: Number(limit),
                        pages: Math.ceil((totalCount || 0) / Number(limit))
                    }
                }
            });
        }
        catch (error) {
            (0, errorHandler_1.handleError)(error, res, 'Failed to get user transactions');
        }
    }
}
exports.WalletController = WalletController;
// Helper function to verify password
async function verifyPassword(password, storedHash) {
    // Implement your password verification logic here
    // This is a placeholder - you should use a proper password hashing library
    return true; // Replace with actual verification
}
