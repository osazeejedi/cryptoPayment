"use strict";
// import { Request, Response } from 'express';
// import { KorapayService } from '../services/korapayService';
// import { PriceService } from '../services/priceService';
// import { BuyController } from './buyController';
// import { BlockchainService } from '../services/blockchainService';
// import { DatabaseService } from '../services/databaseService';
// import { config } from '../../config/env';
// import { PaymentInitData, KorapayPaymentInitData } from '../types/payment';
// import axios from 'axios';
// import { v4 as uuidv4 } from 'uuid';
// export class PaymentController {
//   // /**
//   //  * Process a bank transfer payment
//   //  */
//   // static async processBankTransfer(req: Request, res: Response): Promise<void> {
//   //   try {
//   //     const { 
//   //       naira_amount, 
//   //       crypto_type, 
//   //       email, 
//   //       name, 
//   //       wallet_address,
//   //       bank_code,
//   //       account_number
//   //     } = req.body;
//   //     // Validate request
//   //     if (!naira_amount || !crypto_type || !email || !name || !wallet_address || 
//   //         !bank_code || !account_number) {
//   //       res.status(400).json({ 
//   //         status: 'error', 
//   //         message: 'Missing required parameters' 
//   //       });
//   //       return;
//   //     }
//   //     // Convert Naira to crypto amount
//   //     const cryptoAmount = await PriceService.convertNairaToCrypto(
//   //       naira_amount.toString(),
//   //       crypto_type.toString()
//   //     );
//   //     // Process bank transfer with Korapay
//   //     const paymentResult = await KorapayService.processBankTransfer(
//   //       naira_amount.toString(),
//   //       email,
//   //       name,
//   //       bank_code,
//   //       account_number,
//   //       cryptoAmount,
//   //       crypto_type.toString(),
//   //       wallet_address
//   //     );
//   //     // Bank transfers are usually pending and confirmed via webhook
//   //     res.status(200).json({
//   //       status: paymentResult.status,
//   //       message: paymentResult.status === 'pending' 
//   //         ? 'Bank transfer initiated, awaiting confirmation' 
//   //         : 'Bank transfer processed',
//   //       data: {
//   //         reference: paymentResult.reference,
//   //         naira_amount: naira_amount.toString(),
//   //         crypto_amount: cryptoAmount,
//   //         crypto_type: crypto_type.toString().toUpperCase()
//   //       }
//   //     });
//   //   } catch (error) {
//   //     console.error('Bank transfer error:', error);
//   //     res.status(500).json({ 
//   //       status: 'error', 
//   //       message: error instanceof Error ? error.message : 'An unknown error occurred' 
//   //     });
//   //   }
//   // }
//   /**
//    * Get available banks
//    */
//   static async getBanks(req: Request, res: Response): Promise<void> {
//     try {
//       const banks = await KorapayService.getBanks();
//       res.status(200).json({
//         status: 'success',
//         data: banks
//       });
//     } catch (error) {
//       console.error('Get banks error:', error);
//       res.status(500).json({ 
//         status: 'error', 
//         message: error instanceof Error ? error.message : 'An unknown error occurred' 
//       });
//     }
//   }
//   /**
//    * Verify a payment status
//    */
//   static async verifyPayment(req: Request, res: Response): Promise<void> {
//     try {
//       const { reference } = req.params;
//       if (!reference) {
//         res.status(400).json({
//           status: 'error',
//           message: 'Payment reference is required'
//         });
//         return;
//       }
//       // Make API request to Korapay to verify payment
//       const response = await axios.get(
//         `https://api.korapay.com/merchant/api/v1/charges/${reference}`,
//         {
//           headers: {
//             'Authorization': `Bearer ${config.payment.korapay.secretKey}`
//           }
//         }
//       );
//       const paymentData = response.data.data;
//       res.status(200).json({
//         status: 'success',
//         data: {
//           reference: paymentData.reference,
//           amount: paymentData.amount,
//           currency: paymentData.currency,
//           status: paymentData.status,
//           payment_method: paymentData.payment_method,
//           paid_at: paymentData.paid_at
//         }
//       });
//     } catch (error) {
//       console.error('Error verifying payment:', error);
//       res.status(500).json({ 
//         status: 'error', 
//         message: error instanceof Error ? error.message : 'Failed to verify payment'
//       });
//     }
//   }
//   /**
//    * Handle Korapay webhook
//    */
//   static async handleWebhook(req: Request, res: Response): Promise<void> {
//     try {
//       const signature = req.headers['x-korapay-signature'];
//       if (!signature || !KorapayService.verifyWebhook(req)) {
//         console.error('Invalid webhook signature');
//         res.status(401).json({ status: 'error', message: 'Invalid webhook signature' });
//         return;
//       }
//       const { event, data } = req.body;
//       if (event !== 'charge.success' || data.status !== 'success') {
//         res.status(200).json({ status: 'success', message: 'Webhook received but not processed' });
//         return;
//       }
//       const { crypto_type, wallet_address, crypto_amount } = data.metadata || {};
//       if (!crypto_type || !wallet_address || !crypto_amount) {
//         res.status(400).json({ status: 'error', message: 'Missing required metadata fields' });
//         return;
//       }
//       const txHash = await BlockchainService.transferCrypto(wallet_address, crypto_amount, crypto_type);
//       await DatabaseService.updateTransactionByReference(data.reference, {
//         status: 'completed',
//         blockchainTxHash: txHash
//       });
//       res.status(200).json({ status: 'success', message: 'Payment processed successfully', data: { txHash } });
//     } catch (error) {
//       console.error('Webhook processing error:', error);
//       res.status(500).json({ status: 'error', message: 'Failed to process webhook' });
//     }
//   }
//   /**
//    * Initialize a payment checkout page
//    */
//   static async initializeCheckout(req: Request, res: Response): Promise<void> {
//     try {
//       const { 
//         naira_amount, 
//         crypto_type, 
//         email, 
//         name, 
//         wallet_address
//       } = req.body;
//       // Validate request
//       if (!naira_amount || !crypto_type || !email || !name || !wallet_address) {
//         res.status(400).json({ 
//           status: 'error', 
//           message: 'Missing required parameters' 
//         });
//         return;
//       }
//       // Convert Naira to crypto amount
//       const cryptoAmount = await PriceService.convertNairaToCrypto(
//         naira_amount.toString(),
//         crypto_type.toString()
//       );
//       // Initialize checkout with Korapay
//       const checkoutResult = await KorapayService.initializeCheckout({
//         amount: naira_amount.toString(),
//         currency: 'NGN',
//         reference: `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
//         redirectUrl: `${config.app.baseUrl}/payment/success`,
//         customerEmail: email,
//         customerName: name,
//         metadata: {
//           crypto_type: crypto_type,
//           wallet_address: wallet_address,
//           crypto_amount: cryptoAmount
//         }
//       });
//       res.status(200).json({
//         status: 'success',
//         message: 'Checkout initialized',
//         data: {
//           checkout_url: checkoutResult.checkoutUrl,
//           reference: checkoutResult.reference,
//           naira_amount: naira_amount.toString(),
//           crypto_amount: cryptoAmount,
//           crypto_type: crypto_type.toString().toUpperCase()
//         }
//       });
//     } catch (error) {
//       console.error('Checkout initialization error:', error);
//       res.status(500).json({ 
//         status: 'error', 
//         message: error instanceof Error ? error.message : 'An unknown error occurred' 
//       });
//     }
//   }
//   /**
//    * Handle payment success redirect
//    */
//   static async handlePaymentSuccess(req: Request, res: Response): Promise<void> {
//     try {
//       const reference = req.query.reference as string;
//       if (!reference) {
//         return res.status(400).send('Missing payment reference');
//       }
//       // Verify payment status with Korapay
//       let paymentStatus;
//       let txHash = '';
//       let errorMessage = '';
//       try {
//         paymentStatus = await KorapayService.verifyPayment(reference);
//         if (paymentStatus.status === 'success') {
//           // Extract metadata
//           const { crypto_type, wallet_address, crypto_amount } = paymentStatus.metadata || {};
//           if (crypto_type && wallet_address && crypto_amount) {
//             // Initiate crypto transfer
//             txHash = await BlockchainService.transferCrypto(
//               wallet_address,
//               crypto_amount,
//               crypto_type
//             );
//             console.log(`Crypto transfer initiated. Hash: ${txHash}`);
//           } else {
//             errorMessage = 'Missing required payment metadata';
//             console.error('Missing metadata:', paymentStatus.metadata);
//           }
//         } else {
//           errorMessage = `Payment status: ${paymentStatus.status}`;
//         }
//       } catch (error) {
//         console.error('Error verifying payment:', error);
//         errorMessage = 'Failed to verify payment';
//       }
//       // Render success page with appropriate status
//       res.status(200).send(`
//         <!DOCTYPE html>
//         <html>
//           <head>
//             <title>${txHash ? 'Payment Successful' : 'Payment Processing'}</title>
//             <meta name="viewport" content="width=device-width, initial-scale=1.0">
//             <style>
//               body {
//                 font-family: Arial, sans-serif;
//                 text-align: center;
//                 padding: 40px 20px;
//                 background-color: #f8f9fa;
//                 color: #333;
//               }
//               .container {
//                 max-width: 500px;
//                 margin: 0 auto;
//                 background-color: white;
//                 border-radius: 10px;
//                 padding: 30px;
//                 box-shadow: 0 4px 6px rgba(0,0,0,0.1);
//               }
//               .icon {
//                 font-size: 60px;
//                 margin-bottom: 20px;
//               }
//               .success-icon {
//                 color: #28a745;
//               }
//               .processing-icon {
//                 color: #ffc107;
//               }
//               .error-icon {
//                 color: #dc3545;
//               }
//               h1 {
//                 margin-bottom: 15px;
//               }
//               p {
//                 color: #666;
//                 margin-bottom: 25px;
//               }
//               .info-box {
//                 background-color: #f1f1f1;
//                 padding: 10px;
//                 border-radius: 5px;
//                 font-family: monospace;
//                 margin-bottom: 25px;
//                 word-break: break-all;
//               }
//               .btn {
//                 background-color: #007bff;
//                 color: white;
//                 border: none;
//                 padding: 12px 25px;
//                 border-radius: 5px;
//                 cursor: pointer;
//                 font-size: 16px;
//                 text-decoration: none;
//                 display: inline-block;
//                 margin-top: 10px;
//               }
//               .btn:hover {
//                 background-color: #0069d9;
//               }
//               .loader {
//                 border: 5px solid #f3f3f3;
//                 border-radius: 50%;
//                 border-top: 5px solid #007bff;
//                 width: 40px;
//                 height: 40px;
//                 margin: 20px auto;
//                 animation: spin 1s linear infinite;
//               }
//               @keyframes spin {
//                 0% { transform: rotate(0deg); }
//                 100% { transform: rotate(360deg); }
//               }
//             </style>
//           </head>
//           <body>
//             <div class="container">
//               ${txHash ? 
//                 `<div class="icon success-icon">✓</div>
//                  <h1>Payment Successful!</h1>
//                  <p>Your cryptocurrency has been transferred to your wallet.</p>
//                  <div class="info-box">Transaction Hash: ${txHash}</div>
//                  <p>You can track this transaction on the blockchain explorer.</p>`
//               : errorMessage ? 
//                 `<div class="icon error-icon">✗</div>
//                  <h1>Payment Issue</h1>
//                  <p>${errorMessage}</p>
//                  <div class="info-box">Reference: ${reference}</div>
//                  <p>Please contact support if you need assistance.</p>`
//               :
//                 `<div class="icon processing-icon">⟳</div>
//                  <h1>Payment Processing</h1>
//                  <p>Your payment was received and is being processed.</p>
//                  <div class="loader"></div>
//                  <div class="info-box">Reference: ${reference}</div>
//                  <p>Please wait while we complete your transaction.</p>
//                  <script>
//                    // Refresh the page after 5 seconds to check status
//                    setTimeout(() => {
//                      window.location.reload();
//                    }, 5000);
//                  </script>`
//               }
//               <a href="/" class="btn">Return to Home</a>
//               ${txHash ? 
//                 `<script>
//                    // If this page is opened in a WebView from a mobile app,
//                    // you can communicate back to the app
//                    if (window.ReactNativeWebView) {
//                      window.ReactNativeWebView.postMessage(JSON.stringify({
//                        type: 'CRYPTO_TRANSFERRED',
//                        reference: '${reference}',
//                        txHash: '${txHash}'
//                      }));
//                    }
//                  </script>`
//               : ''}
//             </div>
//           </body>
//         </html>
//       `);
//     } catch (error) {
//       console.error('Error handling payment success:', error);
//       res.status(500).send(`
//         <!DOCTYPE html>
//         <html>
//           <head>
//             <title>Error</title>
//             <meta name="viewport" content="width=device-width, initial-scale=1.0">
//             <style>
//               body {
//                 font-family: Arial, sans-serif;
//                 text-align: center;
//                 padding: 40px 20px;
//                 background-color: #f8f9fa;
//               }
//               .error-container {
//                 max-width: 500px;
//                 margin: 0 auto;
//                 background-color: white;
//                 border-radius: 10px;
//                 padding: 30px;
//                 box-shadow: 0 4px 6px rgba(0,0,0,0.1);
//               }
//               .error-icon {
//                 color: #dc3545;
//                 font-size: 60px;
//                 margin-bottom: 20px;
//               }
//               h1 {
//                 color: #333;
//                 margin-bottom: 15px;
//               }
//               p {
//                 color: #666;
//                 margin-bottom: 25px;
//               }
//               .btn {
//                 background-color: #007bff;
//                 color: white;
//                 border: none;
//                 padding: 12px 25px;
//                 border-radius: 5px;
//                 cursor: pointer;
//                 font-size: 16px;
//                 text-decoration: none;
//                 display: inline-block;
//               }
//               .btn:hover {
//                 background-color: #0069d9;
//               }
//             </style>
//           </head>
//           <body>
//             <div class="error-container">
//               <div class="error-icon">✗</div>
//               <h1>Something went wrong</h1>
//               <p>We encountered an error while processing your payment.</p>
//               <a href="/" class="btn">Return to Home</a>
//             </div>
//           </body>
//         </html>
//       `);
//     }
//   }
//   /**
//    * Process a mobile money payment
//    */
//   static async processMobileMoneyPayment(req: Request, res: Response): Promise<void> {
//     try {
//       console.log("Received mobile money payment request:", JSON.stringify(req.body, null, 2));
//       // Validate request body
//       const { amount, email, name, mobile_number, provider, crypto_amount, crypto_type, wallet_address } = req.body;
//       if (!amount || !email || !name || !mobile_number || !provider || !crypto_amount || !crypto_type || !wallet_address) {
//         res.status(400).json({ status: 'error', message: 'Missing required fields' });
//         return;
//       }
//       // Process mobile money payment
//       const result = await KorapayService.processMobileMoneyPayment(
//         amount,
//         email,
//         name,
//         mobile_number,
//         provider,
//         crypto_amount,
//         crypto_type,
//         wallet_address
//       );
//       // Return the result
//       res.status(200).json({
//         status: 'success',
//         data: {
//           reference: result.reference,
//           status: result.status
//         }
//       });
//     } catch (error) {
//       console.error('Error processing mobile money payment:', error);
//       res.status(500).json({ status: 'error', message: 'Failed to process mobile money payment' });
//     }
//   }
//   /**
//    * Process a checkout payment
//    */
//   static async processCheckout(req: Request, res: Response): Promise<void> {
//     try {
//       console.log('=== CHECKOUT REQUEST RECEIVED ===');
//       console.log('Request body:', JSON.stringify(req.body, null, 2));
//       const { 
//         amount, 
//         email, 
//         name, 
//         payment_method, 
//         crypto_amount, 
//         crypto_type, 
//         wallet_address 
//       } = req.body;
//       // Validate request
//       if (!amount || !email || !payment_method || !crypto_amount || !crypto_type || !wallet_address) {
//         res.status(400).json({ 
//           status: 'error', 
//           message: 'Missing required parameters' 
//         });
//         return;
//       }
//       // Get user ID from email or create a new user
//       let user = await DatabaseService.getUserByEmail(email);
//       if (!user) {
//         // Create a new user
//         user = await DatabaseService.createUser({
//           email,
//           full_name: name || email.split('@')[0]
//         });
//         if (!user) {
//           res.status(500).json({ 
//             status: 'error', 
//             message: 'Failed to create user' 
//           });
//           return;
//         }
//       }
//       // Create a transaction record
//       const transaction = await DatabaseService.createTransaction({
//         user_id: user.id,
//         transaction_type: 'buy',
//         status: 'pending',
//         amount: crypto_amount,
//         cryptoAmount: crypto_amount,
//         cryptoType: crypto_type,
//         walletAddress: wallet_address,
//         paymentMethod: payment_method,
//         fiat_amount: amount,
//         fiat_currency: 'NGN'
//       });
//       if (!transaction) {
//         res.status(500).json({ 
//           status: 'error', 
//           message: 'Failed to create transaction record' 
//         });
//         return;
//       }
//       // Create payload in the format expected by KorapayService
//       const paymentInitData: PaymentInitData = {
//         amount,
//         currency: 'NGN',
//         reference: `buy_${transaction.id}`,
//         redirectUrl: config.payment.korapay.callbackUrl || '',
//         customerEmail: email,
//         customerName: name || email.split('@')[0],
//         metadata: {
//           transaction_id: transaction.id,
//           crypto_amount,
//           crypto_type,
//           wallet_address
//         }
//       };
//       // Initialize payment with Korapay
//       const paymentData = await KorapayService.initializePayment(paymentInitData);
//       // Update transaction with payment reference from Korapay
//       await DatabaseService.updateTransaction(transaction.id, {
//         paymentReference: paymentData.reference
//       });
//       // Return success response with checkout URL
//       res.status(200).json({
//         status: 'success',
//         message: 'Checkout initialized successfully',
//         data: {
//           checkout_url: paymentData.checkout_url,
//           reference: paymentData.reference,
//           transaction_id: transaction.id
//         }
//       });
//     } catch (error) {
//       console.error('Error processing checkout:', error);
//       res.status(500).json({ 
//         status: 'error', 
//         message: error instanceof Error ? error.message : 'Failed to process checkout' 
//       });
//     }
//   }
//   /**
//    * Check payment status
//    */
//   static async checkPaymentStatus(req: Request, res: Response): Promise<void> {
//     try {
//       const { reference } = req.params;
//       if (!reference) {
//         res.status(400).json({
//           status: 'error',
//           message: 'Payment reference is required'
//         });
//         return;
//       }
//       // Get transaction from database
//       const transaction = await DatabaseService.getTransactionByReference(reference);
//       if (!transaction) {
//         res.status(404).json({
//           status: 'error',
//           message: 'Transaction not found'
//         });
//         return;
//       }
//       // Check payment status with Korapay
//       try {
//         const paymentStatus = await KorapayService.verifyPayment(reference);
//         res.status(200).json({
//           status: 'success',
//           data: {
//             payment_status: paymentStatus.status,
//             transaction_status: transaction.status,
//             transaction_id: transaction.id,
//             blockchainTxHash: transaction.blockchainTxHash,
//             amount: transaction.amount,
//             crypto_amount: transaction.cryptoAmount,
//             cryptoType: transaction.cryptoType
//           }
//         });
//       } catch (error) {
//         console.error(`Error checking payment status for ${reference}:`, error);
//         // Return the current transaction status from database
//         res.status(200).json({
//           status: 'success',
//           data: {
//             payment_status: 'unknown',
//             transaction_status: transaction.status,
//             transaction_id: transaction.id,
//             blockchainTxHash: transaction.blockchainTxHash,
//             amount: transaction.amount,
//             crypto_amount: transaction.cryptoAmount,
//             cryptoType: transaction.cryptoType,
//             message: 'Could not verify payment status with provider, showing last known status'
//           }
//         });
//       }
//     } catch (error) {
//       console.error('Error checking payment status:', error);
//       res.status(500).json({
//         status: 'error',
//         message: error instanceof Error ? error.message : 'Failed to check payment status'
//       });
//     }
//   }
//   /**
//    * Generate payment checkout URL
//    */
//   static async generateCheckoutUrl(req: Request, res: Response): Promise<void> {
//     try {
//       const { amount, email, name, phone, reference, callbackUrl, channels } = req.body;
//       // Validate required fields
//       if (!amount || !email) {
//         res.status(400).json({
//           status: 'error',
//           message: 'Amount and email are required'
//         });
//         return;
//       }
//       // Generate a unique reference if not provided
//       const paymentReference = reference || `PAY-${uuidv4()}`;
//       // Default payment channels if not specified
//       const paymentChannels = channels || ['card', 'bank_transfer', 'ussd', 'virtual_account'];
//       // Ensure virtual_account is included in the channels
//       if (!paymentChannels.includes('virtual_account')) {
//         paymentChannels.push('virtual_account');
//       }
//       // Create payment request payload for Korapay
//       const payload = {
//         reference: paymentReference,
//         amount: parseFloat(amount),
//         currency: 'NGN',
//         notification_url: callbackUrl || config.payment.korapay.callbackUrl,
//         return_url: callbackUrl || config.payment.korapay.callbackUrl, // Changed redirect_url to return_url since redirectUrl doesn't exist
//         channels: paymentChannels,
//         customer: {
//           name: name || 'Customer',
//           email: email,
//           phone_number: phone || ''
//         },
//         metadata: {
//           source: 'crypto_payment_api'
//         }
//       };
//       // Make API request to Korapay
//       const response = await axios.post(
//         'https://api.korapay.com/merchant/api/v1/charges/initialize',
//         payload,
//         {
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${config.payment.korapay.secretKey}`
//           }
//         }
//       );
//       res.status(200).json({
//         status: 'success',
//         message: 'Payment checkout URL generated successfully',
//         data: {
//           reference: paymentReference,
//           checkout_url: response.data.data.checkout_url,
//           amount: amount,
//           currency: 'NGN'
//         }
//       });
//     } catch (error) {
//       console.error('Error generating checkout URL:', error);
//       res.status(500).json({
//         status: 'error',
//         message: error instanceof Error ? error.message : 'Failed to generate checkout URL'
//       });
//     }
//   }
// } 
