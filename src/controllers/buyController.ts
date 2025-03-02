import { Request, Response } from 'express';
import { BlockchainService } from '../services/blockchainService';
import { DatabaseService } from '../services/databaseService';
import { config } from '../../config/env';
import { TransactionVerificationService } from '../services/transactionVerificationService';

export class BuyController {
  static async buyRequest(req: Request, res: Response): Promise<void> {
    try {
      console.log('=== BUY REQUEST RECEIVED ===');
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      
      const { user_id, amount, crypto_type, wallet_address } = req.body;
      
      // Validate request
      if (!user_id || !amount || !crypto_type || !wallet_address) {
        console.error('Missing required parameters:', { user_id, amount, crypto_type, wallet_address });
        res.status(400).json({ 
          status: 'error', 
          message: 'Missing required parameters' 
        });
        return;
      }
      
      // Validate wallet address
      if (!BlockchainService.isValidAddress(wallet_address, crypto_type)) {
        console.error('Invalid wallet address:', wallet_address);
        res.status(400).json({ 
          status: 'error', 
          message: 'Invalid wallet address' 
        });
        return;
      }
      
      // Check if user exists
      const user = await DatabaseService.getUserById(user_id);
      if (!user) {
        console.error('User not found:', user_id);
        res.status(404).json({ 
          status: 'error', 
          message: 'User not found' 
        });
        return;
      }
      
      // Create a transaction record
      const transaction = await DatabaseService.createTransaction({
        user_id,
        transaction_type: 'buy',
        status: 'pending',
        amount,
        crypto_type,
        to_address: wallet_address,
        fiat_currency: 'NGN',
        fiat_amount: (parseFloat(amount) * 1000).toString(), // Example conversion rate
      });
      
      if (!transaction) {
        console.error('Failed to create transaction record');
        res.status(500).json({ 
          status: 'error', 
          message: 'Failed to create transaction record' 
        });
        return;
      }
      
      // Process the buy request
      const txHash = await BlockchainService.processBuyRequest(
        user_id,
        amount,
        crypto_type,
        transaction.fiat_amount || '0',
        wallet_address
      );
      
      // Update transaction with blockchain hash
      await DatabaseService.updateTransactionStatus(
        transaction.id,
        'completed',
        txHash
      );
      
      // Return success response
      res.status(200).json({
        status: 'success',
        message: 'Buy request processed successfully',
        data: {
          transaction_id: transaction.id,
          blockchain_tx_hash: txHash,
          amount,
          crypto_type,
          wallet_address
        }
      });
    } catch (error) {
      console.error('Error processing buy request:', error);
      res.status(500).json({ 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Failed to process buy request' 
      });
    }
  }
  
  /**
   * Process a buy request programmatically (for internal use)
   * @param buyData The buy request data
   * @returns Transaction hash
   */
  static async processBuyRequest(buyData: {
    user_id: string;
    amount: string;
    crypto_type: string;
    wallet_address: string;
    payment_reference?: string;
  }): Promise<string> {
    try {
      const { amount, wallet_address, crypto_type } = buyData;
      
      // Transfer crypto from company wallet to user wallet
      const txHash = await BlockchainService.transferCrypto(
        wallet_address,
        amount,
        crypto_type
      );
      
      console.log(`Buy processed: ${amount} ${crypto_type} sent to ${wallet_address}, txHash: ${txHash}`);
      
      return txHash;
    } catch (error) {
      console.error('Error processing buy:', error);
      throw new Error('Failed to process buy request');
    }
  }

  /**
   * Verify payment status
   */
  static async verifyPayment(req: Request, res: Response): Promise<void> {
    try {
      const { reference } = req.params;
      
      if (!reference) {
        res.status(400).json({
          status: 'error',
          message: 'Payment reference is required'
        });
        return;
      }
      
      // Use the new verification service
      const verification = await TransactionVerificationService.verifyPayment(reference);
      
      // If payment is successful but crypto hasn't been transferred yet
      if (verification.status === 'success' && 
          verification.transaction && 
          verification.transaction.status !== 'completed' &&
          !verification.transaction.blockchain_tx_hash) {
        
        // Process the crypto transfer
        await BuyController.processCryptoTransfer(verification.transaction);
      }
      
      res.status(200).json({
        status: 'success',
        data: {
          payment_status: verification.status,
          transaction_status: verification.transaction?.status || 'pending',
          transaction_id: verification.transaction?.id,
          blockchain_tx_hash: verification.transaction?.blockchain_tx_hash,
          amount: verification.payment?.amount || verification.transaction?.fiat_amount,
          crypto_amount: verification.transaction?.amount,
          crypto_type: verification.transaction?.crypto_type
        }
      });
    } catch (error) {
      console.error('Error verifying payment:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to verify payment'
      });
    }
  }

  /**
   * Process crypto transfer for a successful payment
   * @param transaction Transaction object
   */
  private static async processCryptoTransfer(transaction: any): Promise<void> {
    try {
      console.log(`Processing crypto transfer for transaction ${transaction.id}`);
      
      // Update transaction status to processing
      await DatabaseService.updateTransactionStatus(transaction.id, 'processing');
      
      // Transfer crypto to user wallet
      const txHash = await BlockchainService.transferCrypto(
        transaction.to_address,
        transaction.amount,
        transaction.crypto_type
      );
      
      // Update transaction with blockchain hash and completed status
      await DatabaseService.updateTransactionStatus(transaction.id, 'completed', txHash);
      
      console.log(`Crypto transfer completed for transaction ${transaction.id}`);
    } catch (error) {
      console.error(`Error processing crypto transfer for transaction ${transaction.id}:`, error);
      await DatabaseService.updateTransactionStatus(transaction.id, 'failed');
    }
  }
} 