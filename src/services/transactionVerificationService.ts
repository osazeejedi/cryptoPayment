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
          await DatabaseService.updateTransactionStatus(
            transaction.id,
            paymentStatus.status === 'success' ? 'completed' : 
              paymentStatus.status === 'failed' ? 'failed' : 'pending'
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
        if (transaction && transaction.blockchain_tx_hash) {
          // 6. Verify on blockchain
          const isConfirmed = await BlockchainService.verifyTransaction(
            transaction.blockchain_tx_hash,
            transaction.crypto_type
          );
          
          if (isConfirmed) {
            // Update transaction status if confirmed on blockchain
            await DatabaseService.updateTransactionStatus(transaction.id, 'completed');
            
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
} 