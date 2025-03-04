import { KorapayService } from './korapayService';
import { DatabaseService } from './databaseService';
import { BlockchainService } from './blockchainService';

export class TransactionVerificationService {
  /**
   * Verify a payment transaction using multiple methods
   * @param reference Payment reference
   * @returns Verification result
   */
  static async verifyPayment(reference: string): Promise<{
    status: 'success' | 'pending' | 'failed';
    transaction: any;
    payment: any;
  }> {
    try {
      console.log(`Verifying payment: ${reference}`);
      
      // 1. Check database first
      const transaction = await DatabaseService.getTransactionByReference(reference);
      
      // 2. If transaction is already marked as completed or failed, return it
      if (transaction && (transaction.status === 'completed' || transaction.status === 'failed')) {
        return {
          status: transaction.status === 'completed' ? 'success' : 'failed',
          transaction,
          payment: null
        };
      }
      
      // 3. Verify with Korapay API
      try {
        const paymentStatus = await KorapayService.verifyPayment(reference);
        
        // 4. Update transaction in database if status has changed
        if (transaction && transaction.status !== paymentStatus.status) {
          await DatabaseService.updateTransaction(
            transaction.id,
            { status: paymentStatus.status === 'success' ? 'completed' : 
              paymentStatus.status === 'failed' ? 'failed' : 'pending' }
          );
        }
        
        return {
          status: paymentStatus.status,
          transaction,
          payment: paymentStatus
        };
      } catch (korapayError) {
        console.error('Error verifying with Korapay:', korapayError);
        
        // 5. If Korapay verification fails but we have a transaction with blockchain hash
        if (transaction && transaction.blockchainTxHash) {
          // 6. Verify on blockchain
          const isConfirmed = await BlockchainService.verifyTransaction(
            transaction.blockchainTxHash,
            transaction.cryptoType
          );
          
          if (isConfirmed) {
            // Update transaction status if confirmed on blockchain
            await DatabaseService.updateTransaction(transaction.id, { status: 'completed' });
            
            return {
              status: 'success', 
              transaction: {
                ...transaction,
                status: 'completed'
              },
              payment: null
            };
          }
        }
        
        // Return current status if we can't verify with Korapay or blockchain
        return {
          status: transaction ? 
            (transaction.status === 'completed' ? 'success' : 
             transaction.status === 'failed' ? 'failed' : 'pending') : 
            'pending',
          transaction,
          payment: null
        };
      }
    } catch (error) {
      console.error('Error in transaction verification:', error);
      throw new Error(`Failed to verify transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify a transaction on the blockchain
   */
  static async verifyTransaction(transactionId: string): Promise<boolean> {
    try {
      // Get transaction from database
      const transaction = await DatabaseService.getTransaction(transactionId);
      
      if (!transaction) {
        console.error(`Transaction not found: ${transactionId}`);
        return false;
      }
      
      // If transaction has a blockchain tx hash, check its status
      if (transaction.blockchainTxHash) {
        const isConfirmed = await BlockchainService.verifyTransaction(
          transaction.blockchainTxHash,
          transaction.cryptoType
        );
        
        if (isConfirmed && transaction.status !== 'confirmed') {
          // Update transaction status to confirmed
          await DatabaseService.updateTransaction(transaction.id, { status: 'confirmed' });
          return true;
        }
      }
      
      return transaction.status === 'confirmed';
    } catch (error) {
      console.error('Error verifying transaction:', error);
      return false;
    }
  }
  
  /**
   * Process pending transactions
   */
  static async processPendingTransactions(): Promise<void> {
    try {
      // Get all pending transactions
      const pendingTransactions = await DatabaseService.getTransactionsByStatus('pending');
      
      for (const transaction of pendingTransactions) {
        // Check if transaction has a blockchain tx hash
        if (transaction && transaction.blockchainTxHash) {
          // Verify transaction on blockchain
          const isConfirmed = await BlockchainService.verifyTransaction(
            transaction.blockchainTxHash,
            transaction.cryptoType
          );
          
          if (isConfirmed) {
            // Update transaction status to completed
            await DatabaseService.updateTransaction(transaction.id, { status: 'completed' });
          }
        }
      }
    } catch (error) {
      console.error('Error processing pending transactions:', error);
    }
  }
} 