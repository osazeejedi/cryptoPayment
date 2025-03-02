"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BalanceController = void 0;
const balanceService_1 = require("../services/balanceService");
class BalanceController {
    static async getBalance(req, res) {
        try {
            const { wallet_address, token_address } = req.query;
            // Validate request
            if (!wallet_address) {
                res.status(400).json({ status: 'error', message: 'Missing wallet_address parameter' });
                return;
            }
            // If token_address is provided, get token balance
            if (token_address) {
                const tokenBalance = await balanceService_1.BalanceService.getTokenBalance(wallet_address.toString(), token_address.toString());
                res.status(200).json({
                    status: 'success',
                    wallet_address: wallet_address.toString(),
                    token_address: token_address.toString(),
                    balance: tokenBalance,
                    timestamp: new Date().toISOString()
                });
                return;
            }
            // Otherwise get ETH balance
            const ethBalance = await balanceService_1.BalanceService.getEthBalance(wallet_address.toString());
            res.status(200).json({
                status: 'success',
                wallet_address: wallet_address.toString(),
                balance: ethBalance,
                currency: 'ETH',
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('Balance fetch error:', error);
            res.status(500).json({
                status: 'error',
                message: error instanceof Error ? error.message : 'An unknown error occurred'
            });
        }
    }
}
exports.BalanceController = BalanceController;
//# sourceMappingURL=balanceController.js.map