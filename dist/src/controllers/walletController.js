"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletController = void 0;
const databaseService_1 = require("../services/databaseService");
const walletService_1 = require("../services/walletService");
const blockchainService_1 = require("../services/blockchainService");
class WalletController {
    /**
     * Get user wallet
     */
    static async getUserWallet(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    status: 'error',
                    message: 'Unauthorized'
                });
                return;
            }
            // Get user's wallets
            let wallets = await databaseService_1.DatabaseService.getUserWallets(userId);
            // If user has no wallet, create one
            if (wallets.length === 0) {
                // Create an ETH wallet for the user
                const walletData = await walletService_1.WalletService.generateWallet();
                if (!walletData) {
                    res.status(500).json({
                        status: 'error',
                        message: 'Failed to generate wallet'
                    });
                    return;
                }
                const newWallet = await databaseService_1.DatabaseService.createWallet({
                    user_id: userId,
                    address: walletData.address,
                    label: 'Default ETH Wallet',
                    crypto_type: 'ETH',
                    is_primary: true
                });
                if (!newWallet) {
                    res.status(500).json({
                        status: 'error',
                        message: 'Failed to create wallet'
                    });
                    return;
                }
                wallets = [newWallet];
            }
            // Return the first wallet (we're assuming one wallet per user for now)
            res.status(200).json({
                status: 'success',
                data: {
                    eth_address: wallets[0].address,
                    user_id: userId
                }
            });
        }
        catch (error) {
            console.error('Error getting user wallet:', error);
            res.status(500).json({
                status: 'error',
                message: error instanceof Error ? error.message : 'Failed to get wallet'
            });
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
}
exports.WalletController = WalletController;
