"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recoverPendingTransactions = recoverPendingTransactions;
const databaseService_1 = require("../services/databaseService");
const korapayService_1 = require("../services/korapayService");
const blockchainService_1 = require("../services/blockchainService");
/**
 * Job to recover pending transactions
 */
async function recoverPendingTransactions() {
    try {
        console.log('Starting transaction recovery job');
        // Get all pending transactions older than 5 minutes
        const fiveMinutesAgo = new Date();
        fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
        const pendingTransactions = await databaseService_1.DatabaseService.getPendingTransactions(fiveMinutesAgo.toISOString());
        console.log(`Found ${pendingTransactions.length} pending transactions to recover`);
        // Process each pending transaction
        for (const transaction of pendingTransactions) {
            try {
                console.log(`Recovering transaction ${transaction.id}`);
                // Skip transactions without payment reference
                if (!transaction.payment_reference) {
                    console.log(`Transaction ${transaction.id} has no payment reference, skipping`);
                    continue;
                }
                // Check payment status with Korapay
                const paymentStatus = await korapayService_1.KorapayService.verifyPayment(transaction.payment_reference);
                // If payment is successful but crypto hasn't been transferred yet
                if (paymentStatus.status === 'success') {
                    console.log(`Payment ${transaction.payment_reference} successful, processing crypto transfer`);
                    // Update transaction status to processing
                    await databaseService_1.DatabaseService.updateTransaction(transaction.id, { status: 'processing' });
                    try {
                        // Transfer crypto to user wallet
                        const txHash = await blockchainService_1.BlockchainService.transferCrypto(transaction.to_address, transaction.amount, transaction.crypto_type);
                        // Update transaction with blockchain hash and completed status
                        await databaseService_1.DatabaseService.updateTransaction(transaction.id, {
                            status: 'completed',
                            blockchainTxHash: txHash
                        });
                        console.log(`Crypto transfer completed for transaction ${transaction.id}, hash: ${txHash}`);
                    }
                    catch (transferError) {
                        console.error(`Error transferring crypto for transaction ${transaction.id}:`, transferError);
                        await databaseService_1.DatabaseService.updateTransaction(transaction.id, { status: 'failed' });
                    }
                }
                else if (paymentStatus.status === 'failed') {
                    console.log(`Payment ${transaction.payment_reference} failed`);
                    await databaseService_1.DatabaseService.updateTransaction(transaction.id, { status: 'failed' });
                }
                else {
                    console.log(`Payment ${transaction.payment_reference} is still pending`);
                }
            }
            catch (error) {
                console.error(`Error recovering transaction ${transaction.id}:`, error);
            }
        }
        console.log('Transaction recovery job completed');
    }
    catch (error) {
        console.error('Error in transaction recovery job:', error);
    }
}
