"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const userService_1 = require("../services/userService");
const databaseService_1 = require("../services/databaseService");
const walletService_1 = require("../services/walletService");
class UserController {
    /**
     * Get user profile
     */
    static async getUserProfile(req, res) {
        try {
            const userId = req.params.userId;
            // Verify user ID matches authenticated user
            if (req.user?.id !== userId) {
                res.status(403).json({
                    status: 'error',
                    message: 'Unauthorized access to user profile'
                });
                return;
            }
            const profile = await userService_1.UserService.getUserProfile(userId);
            res.status(200).json({
                status: 'success',
                data: profile
            });
        }
        catch (error) {
            console.error('Error getting user profile:', error);
            res.status(500).json({
                status: 'error',
                message: error instanceof Error ? error.message : 'Failed to get user profile'
            });
        }
    }
    /**
     * Create a new wallet for a user
     */
    static async createWallet(req, res) {
        try {
            const userId = req.params.userId;
            const { crypto_type, label } = req.body;
            // Verify user ID matches authenticated user
            if (req.user?.id !== userId) {
                res.status(403).json({
                    status: 'error',
                    message: 'Unauthorized access'
                });
                return;
            }
            if (!crypto_type) {
                res.status(400).json({
                    status: 'error',
                    message: 'Cryptocurrency type is required'
                });
                return;
            }
            const wallet = await userService_1.UserService.createWalletForUser(userId, crypto_type, label);
            if (!wallet) {
                res.status(500).json({
                    status: 'error',
                    message: 'Failed to create wallet'
                });
                return;
            }
            res.status(201).json({
                status: 'success',
                message: 'Wallet created successfully',
                data: {
                    ...wallet,
                    private_key: undefined // Don't expose private key
                }
            });
        }
        catch (error) {
            console.error('Error creating wallet:', error);
            res.status(500).json({
                status: 'error',
                message: error instanceof Error ? error.message : 'Failed to create wallet'
            });
        }
    }
    /**
     * Get user transactions
     */
    static async getUserTransactions(req, res) {
        try {
            const userId = req.params.userId;
            const limit = parseInt(req.query.limit) || 10;
            const offset = parseInt(req.query.offset) || 0;
            // Verify user ID matches authenticated user
            if (req.user?.id !== userId) {
                res.status(403).json({
                    status: 'error',
                    message: 'Unauthorized access to user transactions'
                });
                return;
            }
            const transactions = await databaseService_1.DatabaseService.getUserTransactions(userId, limit, offset);
            res.status(200).json({
                status: 'success',
                data: transactions
            });
        }
        catch (error) {
            console.error('Error getting user transactions:', error);
            res.status(500).json({
                status: 'error',
                message: error instanceof Error ? error.message : 'Failed to get user transactions'
            });
        }
    }
    /**
     * Get wallet transactions
     */
    static async getWalletTransactions(req, res) {
        try {
            const userId = req.params.userId;
            const walletAddress = req.params.walletAddress;
            const limit = parseInt(req.query.limit) || 10;
            // Verify user ID matches authenticated user
            if (req.user?.id !== userId) {
                res.status(403).json({
                    status: 'error',
                    message: 'Unauthorized access to wallet transactions'
                });
                return;
            }
            // Verify wallet belongs to user
            const wallet = await databaseService_1.DatabaseService.getWalletByAddress(walletAddress);
            if (!wallet || wallet.user_id !== userId) {
                res.status(403).json({
                    status: 'error',
                    message: 'Unauthorized access to wallet'
                });
                return;
            }
            const transactions = await walletService_1.WalletService.getWalletTransactions(walletAddress, limit);
            res.status(200).json({
                status: 'success',
                data: transactions
            });
        }
        catch (error) {
            console.error('Error getting wallet transactions:', error);
            res.status(500).json({
                status: 'error',
                message: error instanceof Error ? error.message : 'Failed to get wallet transactions'
            });
        }
    }
    /**
     * Register a new user with wallet
     */
    static async registerUser(req, res) {
        try {
            const { id, email, full_name, phone_number } = req.body;
            if (!id || !email) {
                res.status(400).json({
                    status: 'error',
                    message: 'User ID and email are required'
                });
                return;
            }
            const result = await userService_1.UserService.createUserWithWallet({
                id,
                email,
                full_name,
                phone_number
            });
            res.status(201).json({
                status: 'success',
                message: 'User registered successfully with default wallets',
                data: result
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
}
exports.UserController = UserController;
