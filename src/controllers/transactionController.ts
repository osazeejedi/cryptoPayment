import { Request, Response } from 'express';
import { DatabaseService } from '../services/databaseService';
import { AuthenticatedRequest } from '../types/express';

export class TransactionController {
  /**
   * Get user transactions
   */
  static async getUserTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      
      // Get transactions from database
      const transactions = await DatabaseService.getUserTransactions(userId);
      
      res.status(200).json({
        status: 'success',
        data: {
          transactions
        }
      });
    } catch (error) {
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
  static async getTransactionDetails(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // Get transaction from database
      const transaction = await DatabaseService.getTransaction(id);
      
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
    } catch (error) {
      console.error('Error getting transaction details:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to get transaction details'
      });
    }
  }
} 