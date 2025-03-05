"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferController = void 0;
const blockchainService_1 = require("../services/blockchainService");
const balanceService_1 = require("../services/balanceService");
class TransferController {
    /**
     * Send cryptocurrency to a specified address
     */
    static async sendCrypto(req, res) {
        try {
            console.log("Received crypto transfer request:", JSON.stringify(req.body, null, 2));
            const { from_private_key, to_address, amount, crypto_type } = req.body;
            // Validate request
            if (!from_private_key || !to_address || !amount || !crypto_type) {
                res.status(400).json({
                    status: 'error',
                    message: 'Missing required fields'
                });
                return;
            }
            // Validate address
            if (!blockchainService_1.BlockchainService.isValidAddress(to_address, crypto_type)) {
                res.status(400).json({
                    status: 'error',
                    message: 'Invalid destination address'
                });
                return;
            }
            // Send crypto
            const txHash = await blockchainService_1.BlockchainService.sendCrypto(from_private_key, to_address, amount, crypto_type);
            res.status(200).json({
                status: 'success',
                data: {
                    transaction_hash: txHash,
                    from_address: blockchainService_1.BlockchainService.getAddressFromPrivateKey(from_private_key),
                    to_address,
                    amount,
                    crypto_type,
                    timestamp: new Date().toISOString()
                }
            });
        }
        catch (error) {
            console.error('Error sending crypto:', error);
            res.status(500).json({
                status: 'error',
                message: error instanceof Error ? error.message : 'Failed to send crypto'
            });
        }
    }
    /**
     * Get transfer fee estimate
     */
    static async getTransferFee(req, res) {
        try {
            const { crypto_type } = req.query;
            if (!crypto_type) {
                res.status(400).json({
                    status: 'error',
                    message: 'Crypto type is required'
                });
                return;
            }
            // For testing, we'll just return a fixed fee
            // In a real implementation, we would call the blockchain service
            const fee = '0.0001'; // Mock fee for testing
            res.status(200).json({
                status: 'success',
                data: {
                    fee,
                    crypto_type,
                    timestamp: new Date().toISOString()
                }
            });
        }
        catch (error) {
            console.error('Error getting transfer fee:', error);
            res.status(500).json({
                status: 'error',
                message: error instanceof Error ? error.message : 'Failed to get transfer fee'
            });
        }
    }
    /**
     * Get the balance of a wallet
     */
    static async getBalance(req, res) {
        try {
            const { address, crypto_type } = req.query;
            if (!address || !crypto_type) {
                res.status(400).json({
                    status: 'error',
                    message: 'Address and crypto type are required'
                });
                return;
            }
            // Validate the address
            if (!blockchainService_1.BlockchainService.isValidAddress(address, crypto_type)) {
                res.status(400).json({
                    status: 'error',
                    message: `Invalid ${crypto_type} address: ${address}`
                });
                return;
            }
            // Get the balance
            const balance = await balanceService_1.BalanceService.getWalletBalance(address, crypto_type);
            res.status(200).json({
                status: 'success',
                data: {
                    address,
                    crypto_type,
                    balance,
                    timestamp: new Date().toISOString()
                }
            });
        }
        catch (error) {
            console.error('Error getting balance:', error);
            res.status(500).json({
                status: 'error',
                message: error instanceof Error ? error.message : 'Failed to get wallet balance'
            });
        }
    }
}
exports.TransferController = TransferController;
