"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SellController = void 0;
const korapayService_1 = require("../services/korapayService");
const blockchainService_1 = require("../services/blockchainService");
const priceService_1 = require("../services/priceService");
const databaseService_1 = require("../services/databaseService");
const env_1 = require("../../config/env");
const uuid_1 = require("uuid");
class SellController {
    /**
     * Verify a bank account
     */
    static async verifyBankAccount(req, res) {
        try {
            const { account_number, bank_code } = req.body;
            // Validate request
            if (!account_number || !bank_code) {
                res.status(400).json({
                    status: 'error',
                    message: 'Account number and bank code are required'
                });
                return;
            }
            // Verify account with Korapay
            const accountDetails = await korapayService_1.KorapayService.verifyBankAccount(account_number, bank_code);
            // Return account details
            res.status(200).json({
                status: 'success',
                data: accountDetails
            });
        }
        catch (error) {
            console.error('Error verifying bank account:', error);
            res.status(500).json({
                status: 'error',
                message: error instanceof Error ? error.message : 'Failed to verify bank account'
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
     * Process a sell request with bank payout
     */
    static async processBankPayout(req, res) {
        try {
            // Extract request data
            const { crypto_amount, crypto_type, bank_code, account_number, account_name, user_wallet_address, user_private_key } = req.body;
            // Validate required fields
            if (!crypto_amount || !crypto_type || !bank_code || !account_number ||
                !account_name || !user_wallet_address || !user_private_key) {
                res.status(400).json({
                    success: false,
                    message: 'Missing required fields'
                });
                return;
            }
            // Validate wallet address
            if (!blockchainService_1.BlockchainService.isValidAddress(user_wallet_address, crypto_type)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid wallet address'
                });
                return;
            }
            // Convert crypto to Naira
            const nairaAmount = await priceService_1.PriceService.convertCryptoToNaira(crypto_amount, crypto_type);
            // Generate a unique reference for this transaction
            const reference = `SELL-${(0, uuid_1.v4)()}`;
            console.log(`Processing sell request: ${crypto_amount} ${crypto_type} for ₦${nairaAmount}`);
            // First, transfer crypto from user wallet to company wallet
            try {
                console.log(`Initiating crypto transfer from ${user_wallet_address} to company wallet...`);
                const txHash = await blockchainService_1.BlockchainService.sendCrypto(user_private_key, env_1.config.blockchain.companyWallet.address, crypto_amount, crypto_type);
                console.log(`Crypto transfer successful. Transaction hash: ${txHash}`);
                // Now process the bank payout
                const payoutData = {
                    amount: nairaAmount,
                    bank_code,
                    account_number,
                    account_name,
                    narration: `Crypto sell: ${crypto_amount} ${crypto_type}`,
                    reference
                };
                console.log('Initiating bank payout:', payoutData);
                const payoutResult = await korapayService_1.KorapayService.processBankPayout(payoutData);
                console.log('Bank payout result:', payoutResult);
            }
            catch (error) {
                console.error('Error transferring crypto:', error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to transfer cryptocurrency',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
                return;
            }
        }
        catch (error) {
            console.error('Error processing sell request:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to process sell request',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return;
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
