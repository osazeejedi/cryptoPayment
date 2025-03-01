"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuyController = void 0;
const blockchainService_1 = require("../services/blockchainService");
const priceService_1 = require("../services/priceService");
class BuyController {
    static async buyRequest(req, res) {
        try {
            const { user_id, amount, crypto_type, wallet_address } = req.body;
            // Validate request
            if (!user_id || !amount || !crypto_type || !wallet_address) {
                res.status(400).json({ status: 'error', message: 'Missing required fields' });
                return;
            }
            // Convert crypto to Naira
            const nairaValue = await priceService_1.PriceService.convertCryptoToNaira(amount, crypto_type);
            // Process the buy request
            const txHash = await blockchainService_1.BlockchainService.processBuyRequest(user_id, amount, crypto_type, nairaValue, wallet_address);
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
            console.error('Buy request error:', error);
            res.status(500).json({
                status: 'error',
                message: error instanceof Error ? error.message : 'An unknown error occurred'
            });
        }
    }
}
exports.BuyController = BuyController;
//# sourceMappingURL=buyController.js.map