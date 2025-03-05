"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletController = void 0;
const databaseService_1 = require("../services/databaseService");
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
            const { crypto_type } = req.query;
            if (!address || !crypto_type) {
                res.status(400).json({
                    status: 'error',
                    message: 'Address and crypto type are required'
                });
                return;
            }
            // Get balance from blockchain
            const balance = await blockchainService_1.BlockchainService.getBalance(address, crypto_type);
            res.status(200).json({
                status: 'success',
                data: {
                    address,
                    crypto_type,
                    balance
                }
            });
        }
        catch (error) {
            console.error('Error getting wallet balance:', error);
            res.status(500).json({
                status: 'error',
                message: error instanceof Error ? error.message : 'Failed to get wallet balance'
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
    /**
     * Create a new wallet for the user
     */
    static async createWallet(req, res) {
        try {
            const userId = req.user.id;
            const { crypto_type } = req.body;
            if (!crypto_type) {
                res.status(400).json({
                    status: 'error',
                    message: 'Crypto type is required'
                });
                return;
            }
            // Create wallet using blockchain service
            const walletData = await blockchainService_1.BlockchainService.createWallet(crypto_type);
            // Save wallet to database
            const wallet = await databaseService_1.DatabaseService.createWallet({
                user_id: userId,
                address: walletData.address,
                crypto_type,
                private_key: walletData.privateKey, // Note: In a real app, encrypt this!
                is_primary: false // Add this line to fix the error
            });
            // If this is the user's first wallet, make it primary
            if (wallet) {
                // Check if user has any other wallets
                const userWallets = await databaseService_1.DatabaseService.getUserWallets(userId);
                if (userWallets.length === 1) {
                    // This is the first wallet, make it primary
                    await databaseService_1.DatabaseService.updateWallet(wallet.id, { is_primary: true });
                    wallet.is_primary = true;
                }
                res.status(201).json({
                    status: 'success',
                    data: {
                        id: wallet.id,
                        address: wallet.address,
                        crypto_type: wallet.crypto_type
                    }
                });
            }
            else {
                throw new Error('Failed to create wallet');
            }
        }
        catch (error) {
            console.error('Error creating wallet:', error);
            res.status(500).json({
                status: 'error',
                message: error instanceof Error ? error.message : 'Failed to create wallet'
            });
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
