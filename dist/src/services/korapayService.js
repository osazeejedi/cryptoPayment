"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KorapayService = void 0;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../../config/env");
const blockchainService_1 = require("./blockchainService");
const databaseService_1 = require("./databaseService");
class KorapayService {
    /**
     * Generate a unique transaction reference
     */
    static generateReference() {
        return `TX-${Date.now()}-${crypto_1.default.randomBytes(4).toString('hex')}`;
    }
    /**
     * Helper method to get the appropriate headers for each endpoint
     */
    static getHeaders(usePublicKey = false) {
        return {
            'Authorization': `Bearer ${usePublicKey ? this.PUBLIC_KEY : this.SECRET_KEY}`,
            'Content-Type': 'application/json'
        };
    }
    // /**
    //  * Process a bank transfer payment
    //  * @param amount Amount in Naira
    //  * @param email Customer email
    //  * @param name Customer name
    //  * @param bankCode Bank code
    //  * @param accountNumber Account number
    //  * @param cryptoAmount Amount of crypto to buy
    //  * @param cryptoType Type of crypto (ETH, BTC)
    //  * @param walletAddress User's wallet address
    //  * @returns Payment status and reference
    //  */
    // static async processBankTransfer(
    //   amount: string,
    //   email: string,
    //   name: string,
    //   bankCode: string,
    //   accountNumber: string,
    //   cryptoAmount: string,
    //   cryptoType: string,
    //   walletAddress: string
    // ): Promise<{ status: 'success' | 'pending' | 'failed'; reference: string }> {
    //   try {
    //     const reference = this.generateReference();
    //     const payload = {
    //       reference,
    //       amount,
    //       currency: 'NGN',
    //       customer: {
    //         name,
    //         email
    //       },
    //       notification_url: this.CALLBACK_URL,
    //       bank: {
    //         code: bankCode,
    //         account_number: accountNumber
    //       },
    //       metadata: {
    //         crypto_amount: cryptoAmount,
    //         crypto_type: cryptoType,
    //         wallet_address: walletAddress
    //       }
    //     };
    //     const response = await axios.post<KorapayDirectChargeResponse>(
    //       `${this.BASE_URL}/charges/bank-transfer`,
    //       payload,
    //       {
    //         headers: this.getHeaders()
    //       }
    //     );
    //     if (!response.data.status) {
    //       throw new Error(response.data.message || 'Failed to process bank transfer');
    //     }
    //     return {
    //       status: response.data.data.status,
    //       reference: response.data.data.reference
    //     };
    //   } catch (error) {
    //     console.error('Error processing Korapay bank transfer:', error);
    //     throw new Error('Failed to process bank transfer');
    //   }
    // }
    /**
     * Get available banks for payment
     * @returns List of banks with their codes
     */
    static async getBanks() {
        try {
            console.log('Fetching banks from Korapay...');
            const response = await axios_1.default.get(`${this.BASE_URL}/misc/banks`, {
                headers: this.getHeaders(true)
            });
            console.log('Banks API response status:', response.status);
            if (!response.data.status) {
                console.error('Korapay API error:', response.data);
                throw new Error(response.data.message || 'Failed to fetch banks');
            }
            return response.data.data;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                console.error('Axios error fetching banks:', {
                    status: error.response?.status,
                    data: error.response?.data,
                    message: error.message
                });
            }
            else {
                console.error('Error fetching banks:', error);
            }
            throw new Error('Failed to fetch banks');
        }
    }
    /**
     * Verify a payment transaction
     * @param reference Transaction reference
     * @returns Payment verification details
     */
    static async verifyPayment(reference) {
        try {
            const response = await axios_1.default.get(`${this.BASE_URL}/transactions/verify/${reference}`, {
                headers: this.getHeaders()
            });
            if (!response.data.status) {
                throw new Error(response.data.message || 'Failed to verify payment');
            }
            return {
                status: response.data.data.status,
                amount: response.data.data.amount,
                metadata: response.data.data
            };
        }
        catch (error) {
            console.error('Error verifying Korapay payment:', error);
            throw new Error('Failed to verify payment');
        }
    }
    /**
     * Validate a webhook signature from Korapay
     * @param signature The signature from the X-Korapay-Signature header
     * @param payload The request body as a string
     * @returns Whether the signature is valid
     */
    static validateWebhookSignature(signature, payload) {
        try {
            console.log('=== VALIDATING WEBHOOK SIGNATURE ===');
            console.log('Secret key used:', this.SECRET_KEY.substring(0, 5) + '...');
            // Create HMAC using SHA512 and the secret key
            const hmac = crypto_1.default.createHmac('sha512', this.SECRET_KEY);
            // Update HMAC with the payload
            hmac.update(payload);
            // Get the calculated signature
            const calculatedSignature = hmac.digest('hex');
            console.log('Received signature:', signature.substring(0, 10) + '...');
            console.log('Calculated signature:', calculatedSignature.substring(0, 10) + '...');
            // Compare signatures
            const isValid = signature === calculatedSignature;
            console.log('Signature validation result:', isValid ? 'VALID' : 'INVALID');
            if (!isValid) {
                // For debugging, show more details about the mismatch
                console.log('Signature length comparison:', signature.length, calculatedSignature.length);
                // Check if the first few characters match
                const firstCharsMatch = signature.substring(0, 10) === calculatedSignature.substring(0, 10);
                console.log('First 10 chars match:', firstCharsMatch);
                // Try alternative secret key formats
                const alternativeKey = this.SECRET_KEY.replace(/"/g, '').trim();
                if (alternativeKey !== this.SECRET_KEY) {
                    console.log('Trying alternative secret key format...');
                    const altHmac = crypto_1.default.createHmac('sha512', alternativeKey);
                    altHmac.update(payload);
                    const altSignature = altHmac.digest('hex');
                    const altIsValid = signature === altSignature;
                    console.log('Alternative validation result:', altIsValid ? 'VALID' : 'INVALID');
                    if (altIsValid) {
                        console.log('Alternative key format worked! Consider updating your config.');
                        return true;
                    }
                }
            }
            return isValid;
        }
        catch (error) {
            console.error('Error validating webhook signature:', error);
            return false;
        }
    }
    /**
     * Initialize a payment checkout page based on Korapay's official documentation
     * @param amount Amount in Naira
     * @param email Customer email
     * @param name Customer name
     * @param cryptoAmount Amount of crypto to buy
     * @param cryptoType Type of crypto (ETH, BTC)
     * @param walletAddress User's wallet address
     * @returns Checkout URL and reference
     */
    static async initializeCheckout(data) {
        try {
            // Log the request for debugging
            console.log('Initializing checkout with data:', JSON.stringify(data, null, 2));
            const payload = {
                amount: data.amount,
                currency: data.currency,
                reference: data.reference,
                notification_url: this.CALLBACK_URL,
                redirect_url: data.redirectUrl,
                customer: {
                    email: data.customerEmail,
                    name: data.customerName
                },
                metadata: data.metadata
            };
            // Log the API endpoint and headers (without sensitive info)
            console.log('Calling Korapay API:', `${this.BASE_URL}/charges/initialize`);
            const response = await axios_1.default.post(`${this.BASE_URL}/charges/initialize`, payload, {
                headers: {
                    'Authorization': `Bearer ${this.SECRET_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            // Log successful response
            console.log('Korapay response status:', response.status);
            return {
                reference: response.data.data.reference,
                checkoutUrl: response.data.data.checkout_url
            };
        }
        catch (error) {
            // Enhanced error logging
            console.error('Korapay initializeCheckout error:', error);
            if (axios_1.default.isAxiosError(error)) {
                console.error('Response data:', error.response?.data);
                console.error('Response status:', error.response?.status);
            }
            throw new Error('Failed to initialize checkout');
        }
    }
    /**
     * Process a direct mobile money payment
     * @param amount Amount in Naira
     * @param email Customer email
     * @param name Customer name
     * @param mobileNumber Mobile number for mobile money
     * @param provider Mobile money provider (e.g., 'mtn', 'airtel')
     * @param cryptoAmount Amount of crypto to buy
     * @param cryptoType Type of crypto (ETH, BTC)
     * @param walletAddress User's wallet address
     * @returns Payment status and reference
     */
    static async processMobileMoneyPayment(amount, email, name, mobileNumber, provider, cryptoAmount, cryptoType, walletAddress) {
        try {
            const reference = this.generateReference();
            const payload = {
                reference,
                amount,
                currency: 'NGN',
                customer: {
                    name,
                    email
                },
                notification_url: this.CALLBACK_URL,
                mobile_money: {
                    phone: mobileNumber,
                    provider
                },
                metadata: {
                    crypto_amount: cryptoAmount,
                    crypto_type: cryptoType,
                    wallet_address: walletAddress
                }
            };
            console.log('Mobile money payment payload:', JSON.stringify(payload, null, 2));
            const response = await axios_1.default.post(`${this.BASE_URL}/charges/mobile-money`, payload, {
                headers: this.getHeaders()
            });
            if (!response.data.status) {
                throw new Error(response.data.message || 'Failed to process mobile money payment');
            }
            return {
                status: response.data.data.status,
                reference: response.data.data.reference
            };
        }
        catch (error) {
            console.error('Error processing mobile money payment:', error);
            throw new Error('Failed to process mobile money payment');
        }
    }
    /**
     * Verify a bank account
     * @param accountNumber Account number to verify
     * @param bankCode Bank code
     * @returns Account details if verification is successful
     */
    static async verifyBankAccount(accountNumber, bankCode) {
        try {
            console.log(`Verifying bank account: ${accountNumber}, bank code: ${bankCode}`);
            // Fix the URL to use the correct endpoint
            const response = await axios_1.default.get(`https://api.korapay.com/merchant/api/v1/banks/resolve?account_number=${accountNumber}&bank=${bankCode}`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${env_1.config.payment.korapay.secretKey}`
                }
            });
            if (response.status === 200 && response.data.status) {
                return {
                    account_number: response.data.data.account_number,
                    account_name: response.data.data.account_name,
                    bank_code: bankCode,
                    bank_name: response.data.data.bank_name || ''
                };
            }
            throw new Error(response.data.message || 'Failed to verify bank account');
        }
        catch (error) {
            console.error('Error verifying bank account:', error);
            throw new Error('Failed to verify bank account');
        }
    }
    /**
     * Process bank payout
     * @param payoutData Payout data
     * @returns Payout response
     */
    static async processBankPayout(payoutData) {
        try {
            console.log('Processing bank payout:', payoutData);
            // Format amount as string if it's a number
            const amount = typeof payoutData.amount === 'number'
                ? payoutData.amount.toString()
                : payoutData.amount;
            // Prepare payload according to Korapay's expected structure
            const payload = {
                amount,
                currency: "NGN",
                reference: payoutData.reference,
                narration: payoutData.narration || `Payout to ${payoutData.account_name}`,
                destination: {
                    type: "bank_account",
                    bank_account: {
                        bank: payoutData.bank_code,
                        account: payoutData.account_number,
                        name: payoutData.account_name
                    },
                    customer: {
                        name: payoutData.account_name,
                        email: payoutData.email || "customer@example.com"
                    }
                },
                callback_url: env_1.config.payment.korapay.callbackUrl
            };
            console.log('Korapay payout payload:', JSON.stringify(payload, null, 2));
            const response = await axios_1.default.post(`${this.BASE_URL}/transactions/disburse`, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.SECRET_KEY}`
                }
            });
            console.log('Payout response:', response.data);
            return response.data.data;
        }
        catch (error) {
            console.error('Error processing bank payout:', error);
            if (axios_1.default.isAxiosError(error) && error.response) {
                console.error('Korapay error response:', error.response.data);
                throw new Error(`Korapay payout failed: ${JSON.stringify(error.response.data)}`);
            }
            throw new Error(`Failed to process bank payout: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Check payout status
     * @param reference Payout reference
     * @returns Payout status
     */
    static async checkPayoutStatus(reference) {
        try {
            const response = await axios_1.default.get(`https://api.korapay.com/merchant/api/v1/transactions/disburse/${reference}`, {
                headers: {
                    'Authorization': `Bearer ${env_1.config.payment.korapay.secretKey}`
                }
            });
            return response.data.data;
        }
        catch (error) {
            console.error('Error checking payout status:', error);
            if (axios_1.default.isAxiosError(error) && error.response) {
                console.error('Korapay error response:', error.response.data);
            }
            throw new Error(`Failed to check payout status: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Poll for payment status
     * @param reference Payment reference
     * @param maxAttempts Maximum number of polling attempts
     * @param intervalMs Interval between attempts in milliseconds
     * @returns Final payment status
     */
    static async pollPaymentStatus(reference, maxAttempts = 20, intervalMs = 3000) {
        console.log(`Starting payment status polling for reference: ${reference}`);
        let attempts = 0;
        while (attempts < maxAttempts) {
            try {
                attempts++;
                console.log(`Polling attempt ${attempts}/${maxAttempts} for reference: ${reference}`);
                const status = await this.verifyPayment(reference);
                // If payment is no longer pending, return the status
                if (status.status !== 'pending') {
                    console.log(`Payment ${reference} status: ${status.status}`);
                    // Add missing properties to match the expected type
                    const result = {
                        status: status.status,
                        amount: status.amount,
                        currency: 'NGN',
                        reference: reference,
                        fee: '0',
                        customer: { name: '', email: '' },
                        payment_method: 'card',
                        paid_at: new Date().toISOString()
                    };
                    return result;
                }
                // Wait before next attempt
                await new Promise(resolve => setTimeout(resolve, intervalMs));
            }
            catch (error) {
                console.error(`Error polling payment status (attempt ${attempts}):`, error);
                // Continue polling despite errors
            }
        }
        throw new Error(`Payment verification timed out after ${maxAttempts} attempts`);
    }
    /**
     * Initialize payment with Korapay
     */
    static async initializePayment(data) {
        try {
            const response = await axios_1.default.post(`${this.BASE_URL}/charges/initialize`, {
                amount: data.amount,
                currency: data.currency,
                reference: data.reference,
                notification_url: env_1.config.payment.korapay.callbackUrl,
                redirect_url: data.redirectUrl,
                customer: {
                    email: data.customerEmail,
                    name: data.customerName
                },
                metadata: data.metadata
            }, {
                headers: {
                    'Authorization': `Bearer ${this.SECRET_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data.data;
        }
        catch (error) {
            console.error('Error initializing payment:', error);
            throw new Error('Failed to initialize payment');
        }
    }
    /**
     * Verify webhook signature
     */
    static verifyWebhook(req) {
        try {
            const signature = req.headers['x-korapay-signature'];
            if (!signature) {
                console.error('Webhook verification failed: Missing signature');
                return false;
            }
            // Try different formats of the secret key
            const secretKey = this.SECRET_KEY;
            const cleanSecretKey = secretKey.replace(/^["']|["']$/g, '').trim();
            const payload = JSON.stringify(req.body);
            console.log('Webhook payload length:', payload.length);
            console.log('Signature header:', signature);
            // Try with original secret key
            let hash = crypto_1.default
                .createHmac('sha256', secretKey)
                .update(payload)
                .digest('hex');
            if (hash === signature) {
                console.log('Signature verified with original key');
                return true;
            }
            // Try with cleaned secret key
            hash = crypto_1.default
                .createHmac('sha256', cleanSecretKey)
                .update(payload)
                .digest('hex');
            if (hash === signature) {
                console.log('Signature verified with cleaned key');
                return true;
            }
            // Try with SHA512 instead of SHA256
            hash = crypto_1.default
                .createHmac('sha512', secretKey)
                .update(payload)
                .digest('hex');
            if (hash === signature) {
                console.log('Signature verified with SHA512');
                return true;
            }
            // Try with cleaned key and SHA512
            hash = crypto_1.default
                .createHmac('sha512', cleanSecretKey)
                .update(payload)
                .digest('hex');
            if (hash === signature) {
                console.log('Signature verified with cleaned key and SHA512');
                return true;
            }
            console.error('All signature verification attempts failed');
            return false;
        }
        catch (error) {
            console.error('Webhook verification error:', error);
            return false;
        }
    }
    /**
     * Process successful payment
     */
    static async processSuccessfulPayment(reference) {
        try {
            // Get transaction from database
            const transaction = await databaseService_1.DatabaseService.getTransactionByReference(reference);
            if (!transaction) {
                console.error(`Transaction not found for reference: ${reference}`);
                return false;
            }
            // Update transaction status
            await databaseService_1.DatabaseService.updateTransaction(transaction.id, { status: 'paid' });
            // Transfer crypto to customer
            const txHash = await blockchainService_1.BlockchainService.transferCrypto(transaction.walletAddress, transaction.cryptoAmount, transaction.cryptoType);
            // Update transaction with blockchain tx hash
            await databaseService_1.DatabaseService.updateTransaction(transaction.id, {
                status: 'completed',
                blockchainTxHash: txHash
            });
            console.log(`Crypto transfer completed: ${txHash}`);
            return true;
        }
        catch (error) {
            console.error('Error processing successful payment:', error);
            return false;
        }
    }
}
exports.KorapayService = KorapayService;
KorapayService.BASE_URL = 'https://api.korapay.com/merchant/api/v1';
KorapayService.PUBLIC_KEY = env_1.config.payment.korapay.publicKey;
KorapayService.SECRET_KEY = env_1.config.payment.korapay.secretKey;
KorapayService.CALLBACK_URL = env_1.config.payment.korapay.callbackUrl;
