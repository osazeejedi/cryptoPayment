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
import { VirtualAccountService } from '../services/virtualAccountService';
import { PaymentNotificationService } from '../services/paymentNotificationService';

interface WebhookPayload {
  event: string;
  data: {
    reference: string;
    payment_reference: string;
    currency: string;
    amount: number;
    fee: number;
    status: string;
    virtual_bank_account_details: {
      payer_bank_account: {
        account_name: string;
        account_number: string;
        bank_name: string;
      };
      virtual_bank_account: {
        account_name: string;
        account_number: string;
        account_reference: string;
        bank_name: string;
        permanent: boolean;
      };
    };
    transaction_date: string;
  };
}

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
      const { amount, cryptoType, walletAddress, email, name } = req.body;

      if (!amount || !cryptoType || !walletAddress || !email || !name) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      const isValidAddress = await BlockchainService.isValidAddress(walletAddress, cryptoType);
      if (!isValidAddress) {
        return res.status(400).json({ success: false, message: `Invalid ${cryptoType} wallet address` });
      }

      const cryptoAmount = await PriceService.convertNairaToCrypto(amount, cryptoType);

      // Temporarily skip database interaction
      const transactionReference = `BUY-${uuidv4()}`;
      console.log (`${config.app.baseUrl}/api/buy/success?reference=${transactionReference}&crypto_type=${cryptoType}&wallet_address=${walletAddress}&crypto_amount=${cryptoAmount}`)
      const paymentData = await KorapayService.initializeCheckout({
        amount: parseFloat(amount).toString(),
        currency: 'NGN',
        reference: transactionReference,
        redirectUrl: `${config.app.baseUrl}/api/buy/success?reference=${transactionReference}&crypto_type=${cryptoType}&wallet_address=${walletAddress}&crypto_amount=${cryptoAmount}`,
        customerEmail: email,
        customerName: name,
        metadata: {
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
          reference: transactionReference,
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

  
  /**
   * Process virtual account webhook
   */
  static async processPaymentWebhook(req: Request, res: Response): Promise<void> {
    try {
      console.log('\n=== KORAPAY WEBHOOK RECEIVED ===');
      console.log('Headers:', {
        'content-type': req.headers['content-type'],
        'x-korapay-signature': req.headers['x-korapay-signature']
      });
      console.log('Body:', JSON.stringify(req.body, null, 2));

      const payload = req.body as WebhookPayload;

      // Check if it's a successful charge
      if (payload.event === 'charge.success' && payload.data.status === 'success') {
        console.log('\n=== SUCCESSFUL PAYMENT RECEIVED ===');
        console.log('Amount:', payload.data.amount);
        console.log('From:', payload.data.virtual_bank_account_details.payer_bank_account.account_name);
        console.log('Reference:', payload.data.reference);
        console.log('Date:', payload.data.transaction_date);

        // Store payment notification
        PaymentNotificationService.storePayment({
          reference: payload.data.reference,
          amount: payload.data.amount,
          currency: payload.data.currency,
          status: payload.data.status,
          payerName: payload.data.virtual_bank_account_details.payer_bank_account.account_name,
          accountReference: payload.data.virtual_bank_account_details.virtual_bank_account.account_reference,
          date: payload.data.transaction_date,
          timestamp: Date.now()
        });

        // Return success response
        res.status(200).json({
          status: 'success',
          message: 'Payment received successfully',
          reference: payload.data.reference
        });
        return;
      }

      // Log and accept other events
      console.log('\n=== Unhandled Event Type ===');
      console.log('Event:', payload.event);
      
      res.status(200).json({
        status: 'success',
        message: 'Webhook received and logged'
      });

    } catch (error) {
      console.error('Webhook Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
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

  /**
   * Handle payment success and show transfer button
   */
  static async handlePaymentSuccess(req: Request, res: Response): Promise<void> {
    try {
      
      const reference = req.query.reference as string;
      
      if (!reference) {
         res.status(400).send('Missing payment reference');
         return;
      }
      
      // Get metadata from query parameters
      const crypto_type = req.query.crypto_type as string;
      const wallet_address = req.query.wallet_address as string;
      const crypto_amount = req.query.crypto_amount as string;
      
      const amount = crypto_amount
      
      console.log(`Processing crypto transfer: ${amount} ${crypto_type} to ${wallet_address}`);
      
      // Initiate blockchain transfer
      const txHash = await BlockchainService.transferCrypto(
        wallet_address,
        amount,
        crypto_type
      );
      // Render success page with transfer button
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Payment Successful</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: Arial, sans-serif;
                text-align: center;
                padding: 40px 20px;
                background-color: #f8f9fa;
                color: #333;
              }
              .container {
                max-width: 500px;
                margin: 0 auto;
                background-color: white;
                border-radius: 10px;
                padding: 30px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              }
              .icon {
                font-size: 60px;
                margin-bottom: 20px;
              }
              .success-icon {
                color: #28a745;
              }
              .processing-icon {
                color: #ffc107;
              }
              h1 {
                margin-bottom: 15px;
              }
              p {
                color: #666;
                margin-bottom: 25px;
              }
              .info-box {
                background-color: #f1f1f1;
                padding: 10px;
                border-radius: 5px;
                font-family: monospace;
                margin-bottom: 25px;
                word-break: break-all;
                text-align: left;
              }
              .btn {
                background-color: #007bff;
                color: white;
                border: none;
                padding: 12px 25px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
                text-decoration: none;
                display: inline-block;
                margin-top: 10px;
              }
              .btn-success {
                background-color: #28a745;
              }
              .btn:hover {
                opacity: 0.9;
              }
              .loader {
                display: none;
                border: 5px solid #f3f3f3;
                border-radius: 50%;
                border-top: 5px solid #007bff;
                width: 30px;
                height: 30px;
                margin: 20px auto;
                animation: spin 1s linear infinite;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              #result {
                margin-top: 20px;
                padding: 15px;
                border-radius: 5px;
                display: none;
              }
              .success-result {
                background-color: #d4edda;
                color: #155724;
              }
              .error-result {
                background-color: #f8d7da;
                color: #721c24;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon success-icon">✓</div>
              <h1>Payment Successful!</h1>
              <p>Your payment has been received. Click the button below to transfer your cryptocurrency.</p>
              
              <div class="info-box">
                <strong>Reference:</strong> ${reference}<br>
                <strong>Crypto Amount:</strong> ${crypto_amount || 'Not specified'}<br>
                <strong>Crypto Type:</strong> ${crypto_type || 'Not specified'}<br>
                <strong>Wallet Address:</strong> ${wallet_address || 'Not specified'}
              </div>

              
              <div class="loader" id="loader"></div>
              <div id="result"></div>
              
              <a href="/" class="btn" style="margin-top: 20px;">Return to Home</a>
              
              <script>
                function transferCrypto() {
                  const transferBtn = document.getElementById('transferBtn');
                  const loader = document.getElementById('loader');
                  const result = document.getElementById('result');
                  
                  // Disable button and show loader
                  transferBtn.disabled = true;
                  loader.style.display = 'block';
                  result.style.display = 'none';
                  
                  // Prepare data
                  const data = {
                    reference: '${reference}',
                    crypto_type: '${crypto_type || ''}',
                    wallet_address: '${wallet_address || ''}',
                    crypto_amount: '${crypto_amount || ''}'
                  };
                  
                  // Make API call to transfer endpoint
                  fetch('/api/buy/transfer', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                  })
                  .then(response => response.json())
                  .then(data => {
                    loader.style.display = 'none';
                    result.style.display = 'block';
                    
                    if (data.success) {
                      result.className = 'success-result';
                      result.innerHTML = 'Crypto transfer successful! Transaction hash: <br><code>' + data.txHash + '</code>';
                      transferBtn.style.display = 'none';
                      
                      // Notify mobile app if in WebView
                      if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                          type: 'CRYPTO_TRANSFERRED',
                          reference: '${reference}',
                          txHash: data.txHash
                        }));
                      }
                    } else {
                      result.className = 'error-result';
                      result.innerHTML = 'Error: ' + (data.message || 'Failed to transfer crypto');
                      transferBtn.disabled = false;
                    }
                  })
                  .catch(error => {
                    loader.style.display = 'none';
                    result.style.display = 'block';
                    result.className = 'error-result';
                    result.innerHTML = 'Error: ' + error.message;
                    transferBtn.disabled = false;
                  });
                }
              </script>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Error handling payment success:', error);
      res.status(500).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Error</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: Arial, sans-serif;
                text-align: center;
                padding: 40px 20px;
                background-color: #f8f9fa;
              }
              .error-container {
                max-width: 500px;
                margin: 0 auto;
                background-color: white;
                border-radius: 10px;
                padding: 30px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              }
              .error-icon {
                color: #dc3545;
                font-size: 60px;
                margin-bottom: 20px;
              }
              h1 {
                color: #333;
                margin-bottom: 15px;
              }
              p {
                color: #666;
                margin-bottom: 25px;
              }
              .btn {
                background-color: #007bff;
                color: white;
                border: none;
                padding: 12px 25px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
                text-decoration: none;
                display: inline-block;
              }
              .btn:hover {
                background-color: #0069d9;
              }
            </style>
          </head>
          <body>
            <div class="error-container">
              <div class="error-icon">✗</div>
              <h1>Something went wrong</h1>
              <p>We encountered an error while processing your payment.</p>
              <a href="/" class="btn">Return to Home</a>
            </div>
          </body>
        </html>
      `);
    }
  }

  /**
   * Transfer crypto to user's wallet
   */
  static async transferCrypto(req: Request, res: Response): Promise<void> {
    try {
      const { reference, crypto_type, wallet_address, crypto_amount } = req.body;
      
      // Validate required fields
      if (!crypto_type || !wallet_address || !crypto_amount) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
        return;
      }
      
      // Transfer crypto
      const txHash = await BlockchainService.transferCrypto(
        wallet_address,
        crypto_amount,
        crypto_type
      );
      
      // Log the successful transfer
      console.log(`Crypto transfer successful for reference ${reference}. Hash: ${txHash}`);
      
      // Return success response
      res.status(200).json({
        success: true,
        message: 'Crypto transferred successfully',
        txHash: txHash
      });
    } catch (error) {
      console.error('Error transferring crypto:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to transfer crypto'
      });
    }
  }

  /**
   * Create permanent virtual account
   */
  static async createVirtualAccount(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      const {
        account_name,
        bank_code,
        customer_name,
        customer_email,
        bvn
      } = req.body;

      // Validate required fields
      if (!account_name || !bank_code || !customer_name || !customer_email || !bvn) {
        res.status(400).json({
          success: false,
          message: 'All fields are required: account_name, bank_code, customer_name, customer_email, bvn'
        });
        return;
      }

      // Create virtual account
      const virtualAccount = await VirtualAccountService.createVirtualAccount({
        account_name,
        bank_code,
        customer_name,
        customer_email,
        bvn,
        userId
      });

      res.status(200).json({
        success: true,
        message: 'Virtual account created successfully',
        data: virtualAccount
      });
    } catch (error) {
      console.error('Error creating virtual account:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create virtual account'
      });
    }
  }

  /**
   * Test webhook endpoint
   */
  static async testWebhook(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      status: 'success',
      message: 'Webhook endpoint is working',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Manually send crypto after payment
   */
  static async manualCryptoTransfer(req: Request, res: Response): Promise<void> {
    try {
      const { paymentReference, walletAddress, cryptoType, amount } = req.body;
      
      if (!paymentReference || !walletAddress || !cryptoType || !amount) {
        res.status(400).json({
          status: 'error',
          message: 'Missing required parameters'
        });
        return;
      }
      
      console.log('\n=== MANUAL CRYPTO TRANSFER INITIATED ===');
      console.log('Payment Reference:', paymentReference);
      console.log('Wallet Address:', walletAddress);
      console.log('Crypto Type:', cryptoType);
      console.log('Amount:', amount);
      
      // Transfer crypto
      const txHash = await BlockchainService.transferCrypto(
        walletAddress,
        amount,
        cryptoType
      );
      
      console.log('Crypto transfer successful:', txHash);
      
      // Update payment status in database
      // await DatabaseService.updatePaymentStatus(paymentReference, 'completed', txHash);
      
      res.status(200).json({
        status: 'success',
        message: 'Crypto transferred successfully',
        txHash
      });
    } catch (error) {
      console.error('Error in manual crypto transfer:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to transfer crypto'
      });
    }
  }

  /**
   * Get recent payments
   */
  static async getRecentPayments(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const payments = PaymentNotificationService.getRecentPayments(limit);
      
      res.status(200).json({
        status: 'success',
        data: payments
      });
    } catch (error) {
      console.error('Error getting recent payments:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get recent payments'
      });
    }
  }

  /**
   * Get payment by reference
   */
  static async getPaymentByReference(req: Request, res: Response): Promise<void> {
    try {
      const { reference } = req.params;
      const payment = PaymentNotificationService.getPaymentByReference(reference);
      
      if (!payment) {
        res.status(404).json({
          status: 'error',
          message: 'Payment not found'
        });
        return;
      }
      
      res.status(200).json({
        status: 'success',
        data: payment
      });
    } catch (error) {
      console.error('Error getting payment:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get payment'
      });
    }
  }

  /**
   * Poll for new payments
   */
  static async pollPayments(req: Request, res: Response): Promise<void> {
    try {
      const timestamp = req.query.since ? parseInt(req.query.since as string) : 0;
      const payments = PaymentNotificationService.getPaymentsSince(timestamp);
      
      res.status(200).json({
        status: 'success',
        data: payments,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error polling payments:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to poll payments'
      });
    }
  }
} 