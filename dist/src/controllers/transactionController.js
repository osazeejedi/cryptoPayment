"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionController = void 0;
const databaseService_1 = require("../services/databaseService");
class TransactionController {
    /**
     * Get user transactions
     */
    static async getUserTransactions(req, res) {
        try {
            const userId = req.user.id;
            // Get transactions from database
            const transactions = await databaseService_1.DatabaseService.getUserTransactions(userId);
            res.status(200).json({
                status: 'success',
                data: {
                    transactions
                }
            });
        }
        catch (error) {
            console.error('Error getting user transactions:', error);
            res.status(500).json({
                status: 'error',
                message: error instanceof Error ? error.message : 'Failed to get user transactions'
            });
        }
    }
    /**
     * Get transaction details
     */
    static async getTransactionDetails(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            // Get transaction from database
            const transaction = await databaseService_1.DatabaseService.getTransaction(id);
            if (!transaction) {
                res.status(404).json({
                    status: 'error',
                    message: 'Transaction not found'
                });
                return;
            }
            // Check if transaction belongs to user
            if (transaction.user_id !== userId) {
                res.status(403).json({
                    status: 'error',
                    message: 'Unauthorized access to transaction'
                });
                return;
            }
            res.status(200).json({
                status: 'success',
                data: {
                    transaction
                }
            });
        }
        catch (error) {
            console.error('Error getting transaction details:', error);
            res.status(500).json({
                status: 'error',
                message: error instanceof Error ? error.message : 'Failed to get transaction details'
            });
        }
    }
}
exports.TransactionController = TransactionController;
