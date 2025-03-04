import { Request, Response } from 'express';
import { BlockchainService } from '../services/blockchainService';
import { DatabaseService } from '../services/databaseService';
import { config } from '../../config/env';
import { TransactionVerificationService } from '../services/transactionVerificationService';
import { KorapayService } from '../services/korapayService';
import { PriceService } from '../services/priceService';
import { handleError } from '../utils/errorHandler';

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
        user_id: user_id || 'anonymous',
        amount,
        cryptoAmount: amount, // This should be calculated based on exchange rate
        cryptoType: crypto_type,
        walletAddress: wallet_address,
        status: 'pending',
        paymentMethod: 'direct',
        transaction_type: 'buy'
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
        amount, // Use appropriate fiat amount
        wallet_address
      );
      
      // Update transaction with blockchain hash
      await DatabaseService.updateTransaction(transaction.id, {
        status: 'completed',
        blockchainTxHash: txHash
      });
      
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
      await DatabaseService.updateTransaction(transaction.id, { status: 'processing' });
      
      // Transfer crypto to user wallet
      const txHash = await BlockchainService.transferCrypto(
        transaction.walletAddress || transaction.to_address,
        transaction.cryptoAmount || transaction.amount,
        transaction.cryptoType || transaction.crypto_type
      );
      
      // Update transaction with blockchain hash and completed status
      await DatabaseService.updateTransaction(transaction.id, { 
        status: 'completed',
        blockchainTxHash: txHash
      });
      
      console.log(`Crypto transfer completed for transaction ${transaction.id}`);
    } catch (error) {
      console.error(`Error processing crypto transfer for transaction ${transaction.id}:`, error);
      await DatabaseService.updateTransaction(transaction.id, { status: 'failed' });
    }
  }

  /**
   * Initiate a crypto purchase
   */
  static async initiatePurchase(req: Request, res: Response) {
    try {
      const { amount, cryptoType, walletAddress, paymentMethod } = req.body;
      
      // Validate inputs
      if (!amount || !cryptoType || !walletAddress) {
        return res.status(400).json({ 
          success: false, 
          message: 'Missing required fields' 
        });
      }
      
      // Validate wallet address
      const isValidAddress = await BlockchainService.isValidAddress(walletAddress, cryptoType);
      if (!isValidAddress) {
        return res.status(400).json({ 
          success: false, 
          message: `Invalid ${cryptoType} wallet address` 
        });
      }
      
      // Get current crypto price - use a public method
      const cryptoPrice = await PriceService.getCurrentPrice(cryptoType);
      
      // Calculate crypto amount based on fiat amount
      const cryptoAmount = (parseFloat(amount) / cryptoPrice).toFixed(8);
      
      // Create transaction record in database
      const transaction = await DatabaseService.createTransaction({
        user_id: 'anonymous',
        amount,
        cryptoAmount,
        cryptoType,
        walletAddress,
        status: 'pending',
        paymentMethod: paymentMethod || 'card',
        transaction_type: 'buy'
      });
      
      // Initialize payment with Korapay
      const paymentData = await KorapayService.initializePayment({
        amount,
        currency: 'NGN',
        reference: transaction.id,
        redirectUrl: `${process.env.APP_BASE_URL}/payment/callback`,
        customerEmail: req.body.email || 'customer@example.com',
        customerName: req.body.name || 'Customer',
        metadata: {
          transactionId: transaction.id,
          cryptoType,
          cryptoAmount,
          walletAddress
        }
      });
      
      return res.status(200).json({
        success: true,
        message: 'Payment initialized successfully',
        data: {
          paymentUrl: paymentData.checkoutUrl,
          reference: transaction.id,
          cryptoAmount,
          fiatAmount: amount,
          cryptoType
        }
      });
    } catch (error) {
      console.error('Failed to initiate purchase:', error);
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to initiate purchase'
      });
    }
  }
  
  /**
   * Process webhook from payment provider
   */
  static async processWebhook(req: Request, res: Response) {
    try {
      console.log('Received webhook:', JSON.stringify(req.body, null, 2));
      
      // Verify webhook signature
      const isValid = KorapayService.verifyWebhook(req);
      if (!isValid) {
        console.error('Invalid webhook signature');
        return res.status(400).json({ success: false, message: 'Invalid signature' });
      }
      
      const { event, data } = req.body;
      
      // Handle successful payment
      if (event === 'charge.success') {
        const { reference, status } = data;
        
        // Get transaction from database
        const transaction = await DatabaseService.getTransactionByReference(reference);
        if (!transaction) {
          console.error(`Transaction not found for reference: ${reference}`);
          return res.status(404).json({ success: false, message: 'Transaction not found' });
        }
        
        // Update transaction status
        await DatabaseService.updateTransaction(transaction.id, { status: 'paid' });
        
        // Transfer crypto to customer
        const txHash = await BlockchainService.transferCrypto(
          transaction.walletAddress,
          transaction.cryptoAmount,
          transaction.cryptoType
        );
        
        // Update transaction with blockchain tx hash
        await DatabaseService.updateTransaction(transaction.id, { 
          status: 'completed',
          blockchainTxHash: txHash
        });
        
        console.log(`Crypto transfer completed: ${txHash}`);
      }
      
      // Return success to acknowledge webhook
      return res.status(200).json({ success: true, message: 'Webhook processed' });
    } catch (error) {
      console.error('Error processing webhook:', error);
      // Still return 200 to acknowledge receipt
      return res.status(200).json({ success: false, message: 'Error processing webhook' });
    }
  }
  
  /**
   * Check transaction status
   */
  static async checkTransactionStatus(req: Request, res: Response) {
    try {
      const { transactionId } = req.params;
      
      // Get transaction from database
      const transaction = await DatabaseService.getTransaction(transactionId);
      if (!transaction) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
      }
      
      // If transaction has a blockchain tx hash, check its status
      if (transaction.blockchainTxHash && transaction.status === 'completed') {
        const isConfirmed = await BlockchainService.verifyTransaction(
          transaction.blockchainTxHash,
          transaction.cryptoType
        );
        
        // Update confirmation status if needed
        if (isConfirmed && transaction.status !== 'confirmed') {
          await DatabaseService.updateTransaction(transaction.id, { status: 'confirmed' });
          transaction.status = 'confirmed';
        }
      }
      
      return res.status(200).json({
        success: true,
        data: {
          id: transaction.id,
          status: transaction.status,
          cryptoAmount: transaction.cryptoAmount,
          cryptoType: transaction.cryptoType,
          walletAddress: transaction.walletAddress,
          blockchainTxHash: transaction.blockchainTxHash
        }
      });
    } catch (error) {
      console.error('Error checking transaction status:', error);
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to check transaction status'
      });
    }
  }
} 