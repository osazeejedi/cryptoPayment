"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SellController = void 0;
const korapayService_1 = require("../services/korapayService");
const databaseService_1 = require("../services/databaseService");
class SellController {
    /**
     * Verify a bank account
     */
    static async verifyBankAccount(req, res) {
        try {
            console.log("Received bank account verification request:", JSON.stringify(req.body, null, 2));
            const { account_number, bank_code } = req.body;
            if (!account_number || !bank_code) {
                res.status(400).json({
                    status: 'error',
                    message: 'Account number and bank code are required'
                });
                return;
            }
            // Verify bank account
            const accountDetails = await korapayService_1.KorapayService.verifyBankAccount(account_number, bank_code);
            res.status(200).json({
                status: 'success',
                data: accountDetails
            });
        }
        catch (error) {
            console.error('Error verifying bank account:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to verify bank account'
            });
        }
    }
    /**
     * Get list of supported banks
     */
    static async getBanks(req, res) {
        try {
            // Get banks
            const banks = await korapayService_1.KorapayService.getBanks();
            res.status(200).json({
                status: 'success',
                data: banks
            });
        }
        catch (error) {
            console.error('Error getting banks:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to get banks'
            });
        }
    }
    /**
     * Process a sell request
     */
    static async sellRequest(req, res) {
        try {
            console.log("=== SELL REQUEST RECEIVED ===");
            console.log("Request body:", JSON.stringify(req.body, null, 2));
            const { crypto_amount, crypto_type, private_key, user_id, bank_account } = req.body;
            // Extract bank account details
            const bank_account_number = bank_account?.account_number;
            const bank_code = bank_account?.bank_code;
            // Validate request
            if (!user_id || !crypto_amount || !crypto_type || !private_key || !bank_account_number || !bank_code) {
                console.error('Missing required parameters');
                res.status(400).json({
                    status: 'error',
                    message: 'Missing required parameters'
                });
                return;
            }
            // Process the sell request
            const transaction = await databaseService_1.DatabaseService.createTransaction({
                user_id,
                transaction_type: 'sell',
                amount: crypto_amount,
                cryptoType: crypto_type,
                status: 'pending',
                cryptoAmount: '0',
                walletAddress: '',
                paymentMethod: 'bank_transfer',
                notes: `Bank: ${bank_code}, Account: ${bank_account_number}`
            });
            // Return success response
            res.status(200).json({
                status: 'success',
                data: {
                    transaction_id: transaction.id,
                    amount: crypto_amount,
                    crypto_type,
                    status: 'pending'
                }
            });
        }
        catch (error) {
            console.error('Error processing sell request:', error);
            res.status(500).json({
                status: 'error',
                message: error instanceof Error ? error.message : 'Failed to process sell request'
            });
        }
    }
    /**
     * Check the status of a sell transaction
     */
    static async verifySellTransaction(req, res) {
        try {
            const { transaction_id } = req.params;
            if (!transaction_id) {
                res.status(400).json({
                    status: 'error',
                    message: 'Transaction ID is required'
                });
                return;
            }
            // Get transaction from database
            const transaction = await databaseService_1.DatabaseService.getTransaction(transaction_id);
            if (!transaction) {
                res.status(404).json({
                    status: 'error',
                    message: 'Transaction not found'
                });
                return;
            }
            // If transaction has a payment reference, verify with Korapay
            const paymentReference = transaction.paymentReference || null;
            if (paymentReference) {
                const payoutStatus = await korapayService_1.KorapayService.checkPayoutStatus(paymentReference);
                res.status(200).json({
                    status: 'success',
                    data: {
                        transaction_id: transaction.id,
                        blockchain_tx_hash: transaction.blockchainTxHash,
                        payout_reference: paymentReference,
                        payout_status: payoutStatus.status,
                        transaction_status: transaction.status,
                        amount: transaction.amount,
                        crypto_type: transaction.cryptoType,
                        created_at: transaction.createdAt
                    }
                });
            }
            else {
                res.status(200).json({
                    status: 'success',
                    data: {
                        transaction_id: transaction.id,
                        blockchain_tx_hash: transaction.blockchainTxHash,
                        transaction_status: transaction.status,
                        amount: transaction.amount,
                        crypto_type: transaction.cryptoType,
                        created_at: transaction.createdAt
                    }
                });
            }
        }
        catch (error) {
            console.error('Error verifying sell transaction:', error);
            res.status(500).json({
                status: 'error',
                message: error instanceof Error ? error.message : 'Failed to verify sell transaction'
            });
        }
    }
}
exports.SellController = SellController;
