"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SellController = void 0;
const priceService_1 = require("../services/priceService");
const blockchainService_1 = require("../services/blockchainService");
const walletService_1 = require("../services/walletService");
class SellController {
    static async sellRequest(req, res) {
        try {
            const { user_id, amount, crypto_type, wallet_address, wallet_private_key, balance } = req.body;
            // Validate request
            if (!user_id || !amount || !crypto_type || !wallet_address || !wallet_private_key || !balance) {
                res.status(400).json({ status: 'error', message: 'Missing required fields' });
                return;
            }
            // Check if user has sufficient balance
            const hasBalance = walletService_1.WalletService.checkUserBalance(balance, amount);
            if (!hasBalance) {
                res.status(400).json({ status: 'error', message: 'Insufficient funds in user wallet' });
                return;
            }
            // Convert crypto to Naira
            const nairaValue = await priceService_1.PriceService.convertCryptoToNaira(amount, crypto_type);
            // Process the sell request
            const txHash = await blockchainService_1.BlockchainService.processSellRequest(user_id, amount, crypto_type, nairaValue, wallet_address, wallet_private_key);
            // Return response
            res.status(200).json({
                status: 'success',
                transaction_hash: txHash,
                crypto_type,
                amount,
                naira_value: nairaValue,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('Sell request error:', error);
            res.status(500).json({
                status: 'error',
                message: error instanceof Error ? error.message : 'An unknown error occurred'
            });
        }
    }
}
exports.SellController = SellController;
//# sourceMappingURL=sellController.js.map