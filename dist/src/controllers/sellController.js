"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SellController = void 0;
const korapayService_1 = require("../services/korapayService");
const blockchainService_1 = require("../services/blockchainService");
const priceService_1 = require("../services/priceService");
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
            console.log('=== SELL REQUEST RECEIVED ===');
            console.log('Request body:', JSON.stringify(req.body, null, 2));
            const { user_id, amount, crypto_type, private_key, bank_account_number, bank_code, account_name } = req.body;
            // Validate request
            if (!user_id || !amount || !crypto_type || !private_key || !bank_account_number || !bank_code) {
                console.error('Missing required parameters');
                res.status(400).json({
                    status: 'error',
                    message: 'Missing required parameters'
                });
                return;
            }
            // Check if user exists
            const user = await databaseService_1.DatabaseService.getUserById(user_id);
            if (!user) {
                console.error('User not found:', user_id);
                res.status(404).json({
                    status: 'error',
                    message: 'User not found'
                });
                return;
            }
            // Get wallet address from private key
            const walletAddress = blockchainService_1.BlockchainService.getAddressFromPrivateKey(private_key);
            // Calculate fiat amount based on crypto amount
            const cryptoPrice = await priceService_1.PriceService.getCurrentPrice(crypto_type);
            const fiatAmount = (parseFloat(amount) * cryptoPrice).toString();
            // Create a transaction record
            const transaction = await databaseService_1.DatabaseService.createTransaction({
                user_id: user_id || 'anonymous',
                amount,
                cryptoAmount: amount,
                cryptoType: crypto_type,
                walletAddress,
                status: 'pending',
                paymentMethod: 'bank_transfer',
                transaction_type: 'sell'
            });
            if (!transaction) {
                console.error('Failed to create transaction record');
                res.status(500).json({
                    status: 'error',
                    message: 'Failed to create transaction record'
                });
                return;
            }
            // Process the sell request
            console.log('Processing sell request...');
            // 1. Transfer crypto to company wallet
            console.log('Transferring crypto to company wallet...');
            const txHash = await blockchainService_1.BlockchainService.transferFromUserToCompany(private_key, amount, crypto_type);
            // Update transaction with blockchain hash
            await databaseService_1.DatabaseService.updateTransaction(transaction.id, {
                status: 'completed',
                blockchainTxHash: txHash
            });
            // 2. Process bank payout
            console.log('Processing bank payout...');
            const payoutResponse = await korapayService_1.KorapayService.processBankPayout({
                amount: fiatAmount,
                bank_code,
                account_number: bank_account_number,
                account_name: account_name || '',
                narration: `Crypto sell: ${amount} ${crypto_type}`,
                reference: `sell_${transaction.id}`
            });
            // Update transaction with payment reference
            await databaseService_1.DatabaseService.updateTransaction(transaction.id, {
                status: 'completed',
                blockchainTxHash: txHash,
                paymentReference: payoutResponse.reference,
                notes: `Bank payout to ${bank_account_number} (${account_name}) | Ref: ${payoutResponse.reference}`
            });
            // Return success response
            res.status(200).json({
                status: 'success',
                message: 'Sell request processed successfully',
                data: {
                    transaction_id: transaction.id,
                    blockchain_tx_hash: txHash,
                    payout_reference: payoutResponse.reference,
                    amount,
                    crypto_type,
                    fiat_amount: fiatAmount,
                    fiat_currency: 'NGN'
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
