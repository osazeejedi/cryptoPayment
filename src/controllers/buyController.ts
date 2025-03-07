import { Request, Response } from 'express';
import { BlockchainService } from '../services/blockchainService';
import { DatabaseService } from '../services/databaseService';
import { config } from '../../config/env';
import { TransactionVerificationService } from '../services/transactionVerificationService';
import { KorapayService } from '../services/korapayService';
import { PriceService } from '../services/priceService';
import { handleError } from '../utils/errorHandler';
import { AuthenticatedRequest } from '../types/express';
import { supabase } from '../../config/supabase';
import { v4 as uuidv4 } from 'uuid';

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
     // const cryptoPrice = await PriceService.convertNairaToCrypto(amount, "ETH");
      
      // Calculate crypto amount based on fiat amount
      const cryptoAmount = await PriceService.convertNairaToCrypto(amount, "ETH");
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
      const paymentData = await KorapayService.initializeCheckout({
        amount: parseFloat(amount).toString(),
        currency: 'NGN',
        reference: `BUY-${uuidv4()}`,
        redirectUrl: `${config.app.baseUrl}/payment/success`,
        customerEmail: req.body.email || 'customer@example.com',
        customerName: req.body.name || 'Customer',
        metadata: {
          transaction_id: transaction.id,
          crypto_amount: cryptoAmount,
          crypto_type: cryptoType,
          wallet_address: walletAddress
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
   * Get a buy order by ID
   */
  static async getBuyOrderById(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      
      // Get the order from the database
      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
      
      if (error) {
        console.error('Error fetching order:', error);
        res.status(404).json({
          status: 'error',
          message: 'Order not found'
        });
        return;
      }
      
      // Return the order
      res.status(200).json({
        status: 'success',
        data: order
      });
    } catch (error) {
      handleError(error, res, 'Failed to retrieve buy order');
    }
  }
  
  /**
   * Process payment webhook
   */
  static async processPaymentWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { event, data } = req.body;
      
      // Verify webhook signature
      const signature = req.headers['x-korapay-signature'];
      if (!signature || !KorapayService.verifyWebhook(req)) {
        res.status(401).json({
          status: 'error',
          message: 'Invalid webhook signature'
        });
        return;
      }
      
      // Check if this is a successful payment
      if (event !== 'charge.success' || data.status !== 'success') {
        res.status(200).json({
          status: 'success',
          message: 'Webhook received but not processed'
        });
        return;
      }
      
      // Extract metadata
      const { crypto_type, wallet_address } = data.metadata;
      const amount = data.amount;
      
      // Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('reference', data.reference);
      
      if (updateError) {
        console.error('Error updating order status:', updateError);
      }
      
      // Initiate blockchain transfer
      const txHash = await BlockchainService.transferCrypto(
        wallet_address,
        amount,
        crypto_type
      );
      
      // Update order with transaction hash
      if (txHash) {
        await supabase
          .from('orders')
          .update({ 
            status: 'completed',
            transaction_hash: txHash
          })
          .eq('reference', data.reference);
      }
      
      // Return success
      res.status(200).json({
        status: 'success',
        message: 'Payment processed successfully',
        data: { txHash }
      });
    } catch (error) {
      handleError(error, res, 'Failed to process payment webhook');
    }
  }

  /**
   * Create a buy order (alias for initiatePurchase)
   */
  static async createBuyOrder(req: AuthenticatedRequest, res: Response) {
    return this.initiatePurchase(req, res);
  }

  /**
   * Create payment for buying crypto
   */
  static async createPayment(req: Request, res: Response): Promise<void> {
    try {
      // Extract request data
      const { amount, crypto_type, payment_method, email, name } = req.body;
      
      // Validate request
      if (!amount || !crypto_type || !payment_method) {
        res.status(400).json({
          status: 'error',
          message: 'Missing required fields'
        });
        return;
      }
      
      // Create transaction record
      const transaction = await DatabaseService.createTransaction({
        user_id: req.user?.id || 'guest',
        transaction_type: 'buy',
        amount,
        cryptoType: crypto_type,
        status: 'pending',
        cryptoAmount: '0',
        walletAddress: '',
        paymentMethod: payment_method
      });
      
      // Return success response
      res.status(200).json({
        status: 'success',
        data: {
          transaction_id: transaction.id,
          amount,
          crypto_type,
          payment_method,
          status: 'pending'
        }
      });
    } catch (error) {
      console.error('Error creating payment:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create payment'
      });
    }
  }
} 