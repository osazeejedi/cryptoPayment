"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionMonitor = void 0;
// Create a background job to monitor transactions
const blockchainService_1 = require("../services/blockchainService");
const databaseService_1 = require("../services/databaseService");
class TransactionMonitor {
    /**
     * Monitor pending blockchain transactions
     */
    static async monitorPendingTransactions() {
        try {
            console.log('Monitoring pending transactions...');
            // Get all transactions with status 'completed' (sent but not confirmed)
            const pendingTransactions = await databaseService_1.DatabaseService.getTransactionsByStatus('completed');
            for (const transaction of pendingTransactions) {
                if (!transaction.blockchainTxHash) {
                    console.warn(`Transaction ${transaction.id} has no blockchain tx hash`);
                    continue;
                }
                // Check transaction status on blockchain
                const isConfirmed = await blockchainService_1.BlockchainService.verifyTransaction(transaction.blockchainTxHash, transaction.cryptoType);
                if (isConfirmed) {
                    // Update transaction status to confirmed
                    await databaseService_1.DatabaseService.updateTransaction(transaction.id, { status: 'confirmed' });
                    console.log(`Transaction ${transaction.id} confirmed on blockchain`);
                }
                else {
                    console.log(`Transaction ${transaction.id} still pending on blockchain`);
                }
            }
        }
        catch (error) {
            console.error('Error monitoring transactions:', error);
        }
    }
    /**
     * Start the transaction monitor
     */
    static startMonitoring(intervalMinutes = 5) {
        // Run immediately
        this.monitorPendingTransactions();
        // Then run at specified interval
        setInterval(() => {
            this.monitorPendingTransactions();
        }, intervalMinutes * 60 * 1000);
        console.log(`Transaction monitor started, running every ${intervalMinutes} minutes`);
    }
}
exports.TransactionMonitor = TransactionMonitor;
