"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const korapayService_1 = require("../services/korapayService");
const priceService_1 = require("../services/priceService");
const buyController_1 = require("./buyController");
const databaseService_1 = require("../services/databaseService");
const env_1 = require("../../config/env");
class PaymentController {
    /**
     * Process a card payment
     */
    static async processCardPayment(req, res) {
        try {
            console.log("Received card payment request:", JSON.stringify(req.body, null, 2));
            const { naira_amount, crypto_type, email, name, wallet_address, card_number, card_expiry, card_cvv } = req.body;
            // Validate request
            if (!naira_amount || !crypto_type || !email || !name || !wallet_address ||
                !card_number || !card_expiry || !card_cvv) {
                console.log("Missing required parameters:", {
                    naira_amount, crypto_type, email, name, wallet_address,
                    card_number: card_number ? "provided" : "missing",
                    card_expiry: card_expiry ? "provided" : "missing",
                    card_cvv: card_cvv ? "provided" : "missing"
                });
                res.status(400).json({
                    status: 'error',
                    message: 'Missing required parameters'
                });
                return;
            }
            // Convert Naira to crypto amount
            const cryptoAmount = await priceService_1.PriceService.convertNairaToCrypto(naira_amount.toString(), crypto_type.toString());
            // Process card payment with Korapay
            const paymentResult = await korapayService_1.KorapayService.processCardPayment(naira_amount.toString(), email, name, card_number, card_expiry, card_cvv, cryptoAmount, crypto_type.toString(), wallet_address);
            // If payment is successful, trigger buy process
            if (paymentResult.status === 'success') {
                // Create a buy request
                const buyRequest = {
                    user_id: email,
                    amount: cryptoAmount,
                    cryptoType: crypto_type.toString(),
                    walletAddress: wallet_address
                };
                // Process the buy request using the correct method
                await buyController_1.BuyController.buyRequest({ body: buyRequest }, {
                    status: () => ({
                        json: () => { }
                    })
                });
                res.status(200).json({
                    status: 'success',
                    message: 'Payment processed and crypto purchase initiated',
                    data: {
                        reference: paymentResult.reference,
                        naira_amount: naira_amount.toString(),
                        crypto_amount: cryptoAmount,
                        crypto_type: crypto_type.toString().toUpperCase()
                    }
                });
            }
            else if (paymentResult.status === 'pending') {
                res.status(200).json({
                    status: 'pending',
                    message: 'Payment is being processed',
                    data: {
                        reference: paymentResult.reference,
                        naira_amount: naira_amount.toString(),
                        crypto_amount: cryptoAmount,
                        crypto_type: crypto_type.toString().toUpperCase()
                    }
                });
            }
            else {
                res.status(400).json({
                    status: 'failed',
                    message: 'Payment failed',
                    data: {
                        reference: paymentResult.reference
                    }
                });
            }
        }
        catch (error) {
            console.error('Payment processing error:', error);
            res.status(500).json({
                status: 'error',
                message: error instanceof Error ? error.message : 'An unknown error occurred'
            });
        }
    }
    /**
     * Process a bank transfer payment
     */
    static async processBankTransfer(req, res) {
        try {
            const { naira_amount, crypto_type, email, name, wallet_address, bank_code, account_number } = req.body;
            // Validate request
            if (!naira_amount || !crypto_type || !email || !name || !wallet_address ||
                !bank_code || !account_number) {
                res.status(400).json({
                    status: 'error',
                    message: 'Missing required parameters'
                });
                return;
            }
            // Convert Naira to crypto amount
            const cryptoAmount = await priceService_1.PriceService.convertNairaToCrypto(naira_amount.toString(), crypto_type.toString());
            // Process bank transfer with Korapay
            const paymentResult = await korapayService_1.KorapayService.processBankTransfer(naira_amount.toString(), email, name, bank_code, account_number, cryptoAmount, crypto_type.toString(), wallet_address);
            // Bank transfers are usually pending and confirmed via webhook
            res.status(200).json({
                status: paymentResult.status,
                message: paymentResult.status === 'pending'
                    ? 'Bank transfer initiated, awaiting confirmation'
                    : 'Bank transfer processed',
                data: {
                    reference: paymentResult.reference,
                    naira_amount: naira_amount.toString(),
                    crypto_amount: cryptoAmount,
                    crypto_type: crypto_type.toString().toUpperCase()
                }
            });
        }
        catch (error) {
            console.error('Bank transfer error:', error);
            res.status(500).json({
                status: 'error',
                message: error instanceof Error ? error.message : 'An unknown error occurred'
            });
        }
    }
    /**
     * Get available banks
     */
    static async getBanks(req, res) {
        try {
            const banks = await korapayService_1.KorapayService.getBanks();
            res.status(200).json({
                status: 'success',
                data: banks
            });
        }
        catch (error) {
            console.error('Get banks error:', error);
            res.status(500).json({
                status: 'error',
                message: error instanceof Error ? error.message : 'An unknown error occurred'
            });
        }
    }
    /**
     * Verify a payment status
     */
    static async verifyPayment(req, res) {
        try {
            const { reference } = req.params;
            if (!reference) {
                res.status(400).json({ status: 'error', message: 'Reference is required' });
                return;
            }
            const verificationResult = await korapayService_1.KorapayService.verifyPayment(reference);
            // If payment is verified as successful, trigger buy process
            if (verificationResult.status === 'success' && verificationResult.metadata?.metadata) {
                const { crypto_amount, crypto_type, wallet_address } = verificationResult.metadata.metadata;
                // Create a buy request
                const buyRequest = {
                    user_id: verificationResult.metadata.customer.email,
                    amount: crypto_amount,
                    crypto_type,
                    wallet_address
                };
                // Process the buy request using the correct method
                await buyController_1.BuyController.buyRequest({ body: buyRequest }, {
                    status: () => ({
                        json: () => { }
                    })
                });
            }
            res.status(200).json({
                status: 'success',
                data: verificationResult
            });
        }
        catch (error) {
            console.error('Payment verification error:', error);
            res.status(500).json({
                status: 'error',
                message: error instanceof Error ? error.message : 'An unknown error occurred'
            });
        }
    }
    /**
     * Handle Korapay webhook
     */
    static async handleWebhook(req, res) {
        try {
            console.log('=== WEBHOOK RECEIVED ===');
            console.log('Headers:', JSON.stringify(req.headers, null, 2));
            console.log('Body:', JSON.stringify(req.body, null, 2));
            // Get the signature from the headers
            const signature = req.headers['x-korapay-signature'];
            // For debugging purposes, we'll log if the signature is missing
            if (!signature) {
                console.warn('Missing webhook signature - continuing anyway for testing');
                // For testing, we'll continue without a signature
                // In production, you would return a 400 error here
            }
            // Validate the signature if present
            let isValid = true; // Default to true for testing
            if (signature) {
                const payload = JSON.stringify(req.body);
                isValid = korapayService_1.KorapayService.validateWebhookSignature(signature, payload);
                console.log('Signature validation:', isValid ? 'PASSED' : 'FAILED');
            }
            // For testing purposes, we'll continue even if validation fails
            // In production, you would return a 401 error here
            if (!isValid) {
                console.warn('Invalid webhook signature - continuing anyway for testing');
            }
            // Process the webhook
            const event = req.body.event;
            const data = req.body.data;
            if (!event || !data) {
                console.error('Missing event or data in webhook payload');
                res.status(400).json({ status: 'error', message: 'Invalid webhook payload' });
                return;
            }
            console.log(`Processing ${event} event for reference: ${data.reference || 'unknown'}`);
            // Handle multiple possible event names for successful payments
            if ((event === 'charge.completed' || event === 'charge.success' || event === 'transaction.success')
                && data.status === 'success') {
                // Extract metadata
                const metadata = data.metadata || {};
                const crypto_amount = metadata.crypto_amount;
                const crypto_type = metadata.crypto_type;
                const wallet_address = metadata.wallet_address;
                if (!crypto_amount || !crypto_type || !wallet_address) {
                    console.error('Missing required metadata:', metadata);
                    res.status(200).json({ status: 'error', message: 'Missing required metadata' });
                    return;
                }
                console.log('Extracted metadata:', { crypto_amount, crypto_type, wallet_address });
                try {
                    // Create a buy request
                    const buyRequest = {
                        user_id: data.customer?.email || 'unknown@example.com',
                        amount: crypto_amount,
                        crypto_type: crypto_type,
                        wallet_address: wallet_address
                    };
                    console.log('Creating buy request:', JSON.stringify(buyRequest, null, 2));
                    // Process the buy request directly
                    const txHash = await buyController_1.BuyController.processBuyRequest(buyRequest);
                    console.log('Buy request processed successfully with transaction hash:', txHash);
                }
                catch (buyError) {
                    console.error('Error processing buy request:', buyError);
                    // We still return 200 to Korapay to acknowledge receipt
                }
            }
            else {
                console.log('Event not processed:', event, data.status);
            }
            // Acknowledge receipt of the webhook
            res.status(200).json({ status: 'success', message: 'Webhook processed' });
            console.log('=== WEBHOOK PROCESSING COMPLETE ===');
        }
        catch (error) {
            console.error('Error processing webhook:', error);
            // Always return 200 to Korapay to prevent retries
            res.status(200).json({ status: 'error', message: 'Webhook processing failed' });
        }
    }
    /**
     * Initialize a payment checkout page
     */
    static async initializeCheckout(req, res) {
        try {
            const { naira_amount, crypto_type, email, name, wallet_address } = req.body;
            // Validate request
            if (!naira_amount || !crypto_type || !email || !name || !wallet_address) {
                res.status(400).json({
                    status: 'error',
                    message: 'Missing required parameters'
                });
                return;
            }
            // Convert Naira to crypto amount
            const cryptoAmount = await priceService_1.PriceService.convertNairaToCrypto(naira_amount.toString(), crypto_type.toString());
            // Initialize checkout with Korapay
            const checkoutResult = await korapayService_1.KorapayService.initializeCheckout(naira_amount.toString(), email, name, cryptoAmount, crypto_type, wallet_address, {
                crypto_type: crypto_type,
                wallet_address: wallet_address,
                crypto_amount: cryptoAmount
            }, null);
            res.status(200).json({
                status: 'success',
                message: 'Checkout initialized',
                data: {
                    checkout_url: checkoutResult.checkout_url,
                    reference: checkoutResult.reference,
                    naira_amount: naira_amount.toString(),
                    crypto_amount: cryptoAmount,
                    crypto_type: crypto_type.toString().toUpperCase()
                }
            });
        }
        catch (error) {
            console.error('Checkout initialization error:', error);
            res.status(500).json({
                status: 'error',
                message: error instanceof Error ? error.message : 'An unknown error occurred'
            });
        }
    }
    /**
     * Handle payment success redirect
     */
    static async handlePaymentSuccess(req, res) {
        try {
            const { reference } = req.query;
            if (!reference) {
                res.status(400).send('Missing payment reference');
                return;
            }
            // You can render an HTML success page or redirect to your frontend
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
              }
              .success-container {
                max-width: 500px;
                margin: 0 auto;
                background-color: white;
                border-radius: 10px;
                padding: 30px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              }
              .success-icon {
                color: #28a745;
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
              .reference {
                background-color: #f1f1f1;
                padding: 10px;
                border-radius: 5px;
                font-family: monospace;
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
            <div class="success-container">
              <div class="success-icon">✓</div>
              <h1>Payment Successful!</h1>
              <p>Your cryptocurrency purchase is being processed.</p>
              <div class="reference">Reference: ${reference}</div>
              <p>You will receive your crypto shortly.</p>
              <a href="/" class="btn">Return to Home</a>
            </div>
            <script>
              // If this page is opened in a WebView from a mobile app,
              // you can communicate back to the app
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'PAYMENT_SUCCESS',
                  reference: '${reference}'
                }));
              }
            </script>
          </body>
        </html>
      `);
        }
        catch (error) {
            console.error('Error handling payment success:', error);
            res.status(500).send('An error occurred');
        }
    }
    /**
     * Process a mobile money payment
     */
    static async processMobileMoneyPayment(req, res) {
        try {
            console.log("Received mobile money payment request:", JSON.stringify(req.body, null, 2));
            // Validate request body
            const { amount, email, name, mobile_number, provider, crypto_amount, crypto_type, wallet_address } = req.body;
            if (!amount || !email || !name || !mobile_number || !provider || !crypto_amount || !crypto_type || !wallet_address) {
                res.status(400).json({ status: 'error', message: 'Missing required fields' });
                return;
            }
            // Process mobile money payment
            const result = await korapayService_1.KorapayService.processMobileMoneyPayment(amount, email, name, mobile_number, provider, crypto_amount, crypto_type, wallet_address);
            // Return the result
            res.status(200).json({
                status: 'success',
                data: {
                    reference: result.reference,
                    status: result.status
                }
            });
        }
        catch (error) {
            console.error('Error processing mobile money payment:', error);
            res.status(500).json({ status: 'error', message: 'Failed to process mobile money payment' });
        }
    }
    /**
     * Process a checkout payment
     */
    static async processCheckout(req, res) {
        try {
            console.log('=== CHECKOUT REQUEST RECEIVED ===');
            console.log('Request body:', JSON.stringify(req.body, null, 2));
            const { amount, email, name, payment_method, crypto_amount, crypto_type, wallet_address } = req.body;
            // Validate request
            if (!amount || !email || !payment_method || !crypto_amount || !crypto_type || !wallet_address) {
                res.status(400).json({
                    status: 'error',
                    message: 'Missing required parameters'
                });
                return;
            }
            // Get user ID from email or create a new user
            let user = await databaseService_1.DatabaseService.getUserByEmail(email);
            if (!user) {
                // Create a new user
                user = await databaseService_1.DatabaseService.createUser({
                    email,
                    full_name: name || email.split('@')[0]
                });
                if (!user) {
                    res.status(500).json({
                        status: 'error',
                        message: 'Failed to create user'
                    });
                    return;
                }
            }
            // Create a transaction record
            const transaction = await databaseService_1.DatabaseService.createTransaction({
                user_id: user.id,
                transaction_type: 'buy',
                status: 'pending',
                amount: crypto_amount,
                cryptoAmount: crypto_amount,
                cryptoType: crypto_type,
                walletAddress: wallet_address,
                paymentMethod: payment_method,
                fiat_amount: amount,
                fiat_currency: 'NGN'
            });
            if (!transaction) {
                res.status(500).json({
                    status: 'error',
                    message: 'Failed to create transaction record'
                });
                return;
            }
            // Create payload in the format expected by KorapayService
            const paymentInitData = {
                amount,
                currency: 'NGN',
                reference: `buy_${transaction.id}`,
                redirectUrl: env_1.config.payment.korapay.callbackUrl || '',
                customerEmail: email,
                customerName: name || email.split('@')[0],
                metadata: {
                    transaction_id: transaction.id,
                    crypto_amount,
                    crypto_type,
                    wallet_address
                }
            };
            // Initialize payment with Korapay
            const paymentData = await korapayService_1.KorapayService.initializePayment(paymentInitData);
            // Update transaction with payment reference from Korapay
            await databaseService_1.DatabaseService.updateTransaction(transaction.id, {
                paymentReference: paymentData.reference
            });
            // Return success response with checkout URL
            res.status(200).json({
                status: 'success',
                message: 'Checkout initialized successfully',
                data: {
                    checkout_url: paymentData.checkout_url,
                    reference: paymentData.reference,
                    transaction_id: transaction.id
                }
            });
        }
        catch (error) {
            console.error('Error processing checkout:', error);
            res.status(500).json({
                status: 'error',
                message: error instanceof Error ? error.message : 'Failed to process checkout'
            });
        }
    }
    /**
     * Check payment status
     */
    static async checkPaymentStatus(req, res) {
        try {
            const { reference } = req.params;
            if (!reference) {
                res.status(400).json({
                    status: 'error',
                    message: 'Payment reference is required'
                });
                return;
            }
            // Get transaction from database
            const transaction = await databaseService_1.DatabaseService.getTransactionByReference(reference);
            if (!transaction) {
                res.status(404).json({
                    status: 'error',
                    message: 'Transaction not found'
                });
                return;
            }
            // Check payment status with Korapay
            try {
                const paymentStatus = await korapayService_1.KorapayService.verifyPayment(reference);
                res.status(200).json({
                    status: 'success',
                    data: {
                        payment_status: paymentStatus.status,
                        transaction_status: transaction.status,
                        transaction_id: transaction.id,
                        blockchainTxHash: transaction.blockchainTxHash,
                        amount: transaction.amount,
                        crypto_amount: transaction.cryptoAmount,
                        cryptoType: transaction.cryptoType
                    }
                });
            }
            catch (error) {
                console.error(`Error checking payment status for ${reference}:`, error);
                // Return the current transaction status from database
                res.status(200).json({
                    status: 'success',
                    data: {
                        payment_status: 'unknown',
                        transaction_status: transaction.status,
                        transaction_id: transaction.id,
                        blockchainTxHash: transaction.blockchainTxHash,
                        amount: transaction.amount,
                        crypto_amount: transaction.cryptoAmount,
                        cryptoType: transaction.cryptoType,
                        message: 'Could not verify payment status with provider, showing last known status'
                    }
                });
            }
        }
        catch (error) {
            console.error('Error checking payment status:', error);
            res.status(500).json({
                status: 'error',
                message: error instanceof Error ? error.message : 'Failed to check payment status'
            });
        }
    }
}
exports.PaymentController = PaymentController;
