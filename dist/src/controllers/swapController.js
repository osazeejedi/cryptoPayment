"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwapController = void 0;
const blockchainService_1 = require("../services/blockchainService");
class SwapController {
    /**
     * Swap one cryptocurrency for another
     */
    static async swapCrypto(req, res) {
        try {
            console.log("Received swap request:", JSON.stringify(req.body, null, 2));
            const { private_key, amount, from_crypto, to_crypto, slippage_percentage } = req.body;
            // Validate request
            if (!private_key || !amount || !from_crypto || !to_crypto) {
                res.status(400).json({
                    status: 'error',
                    message: 'Missing required parameters'
                });
                return;
            }
            // Validate the private key format (basic check)
            if (!private_key.startsWith('0x') || private_key.length !== 66) {
                res.status(400).json({
                    status: 'error',
                    message: 'Invalid private key format'
                });
                return;
            }
            // Validate amount
            const numAmount = parseFloat(amount);
            if (isNaN(numAmount) || numAmount <= 0) {
                res.status(400).json({
                    status: 'error',
                    message: 'Invalid amount'
                });
                return;
            }
            // Validate crypto types
            if ((from_crypto !== 'ETH' && from_crypto !== 'USDT') ||
                (to_crypto !== 'ETH' && to_crypto !== 'USDT')) {
                res.status(400).json({
                    status: 'error',
                    message: 'Only ETH and USDT swaps are supported'
                });
                return;
            }
            if (from_crypto === to_crypto) {
                res.status(400).json({
                    status: 'error',
                    message: 'Cannot swap a token for itself'
                });
                return;
            }
            // Get wallet address from private key
            const walletAddress = blockchainService_1.BlockchainService.getAddressFromPrivateKey(private_key);
            // Execute the swap
            const txHash = await blockchainService_1.BlockchainService.swapCrypto(private_key, amount, from_crypto, to_crypto, slippage_percentage || 0.5);
            // Return the transaction details
            res.status(200).json({
                status: 'success',
                message: `Successfully swapped ${amount} ${from_crypto} to ${to_crypto}`,
                data: {
                    transaction_hash: txHash,
                    from_address: walletAddress,
                    from_crypto,
                    to_crypto,
                    amount,
                    timestamp: new Date().toISOString()
                }
            });
        }
        catch (error) {
            console.error('Error swapping crypto:', error);
            res.status(500).json({
                status: 'error',
                message: error instanceof Error ? error.message : 'Failed to swap cryptocurrency'
            });
        }
    }
    /**
     * Get estimated swap output amount
     */
    static async getSwapEstimate(req, res) {
        try {
            const { amount, from_crypto, to_crypto } = req.query;
            if (!amount || !from_crypto || !to_crypto) {
                res.status(400).json({
                    status: 'error',
                    message: 'Missing required parameters'
                });
                return;
            }
            // Validate amount
            const numAmount = parseFloat(amount);
            if (isNaN(numAmount) || numAmount <= 0) {
                res.status(400).json({
                    status: 'error',
                    message: 'Invalid amount'
                });
                return;
            }
            // Get the swap estimate
            const estimatedOutput = await blockchainService_1.BlockchainService.getSwapEstimate(amount, from_crypto, to_crypto);
            res.status(200).json({
                status: 'success',
                data: {
                    input_amount: amount,
                    input_crypto: from_crypto,
                    output_crypto: to_crypto,
                    estimated_output: estimatedOutput,
                    timestamp: new Date().toISOString()
                }
            });
        }
        catch (error) {
            console.error('Error getting swap estimate:', error);
            res.status(500).json({
                status: 'error',
                message: error instanceof Error ? error.message : 'Failed to get swap estimate'
            });
        }
    }
}
exports.SwapController = SwapController;
