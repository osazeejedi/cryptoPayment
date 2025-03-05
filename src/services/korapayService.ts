import axios from 'axios';
import crypto from 'crypto';
import { config } from '../../config/env';
import { Request } from 'express';
import { BlockchainService } from './blockchainService';
import { DatabaseService } from './databaseService';

interface KorapayDirectChargeResponse {
  status: boolean;
  message: string;
  data: {
    reference: string;
    status: 'success' | 'pending' | 'failed';
    amount: string;
  };
}

interface KorapayVerifyPaymentResponse {
  status: boolean;
  message: string;
  data: {
    status: 'success' | 'pending' | 'failed';
    amount: string;
    currency: string;
    reference: string;
    fee: string;
    customer: {
      name: string;
      email: string;
    };
    payment_method: string;
    paid_at: string;
  };
}

interface PaymentInitData {
  amount: string;
  currency: string;
  reference: string;
  redirectUrl: string;
  customerEmail: string;
  customerName: string;
  metadata: any;
}

export class KorapayService {
  private static BASE_URL = 'https://api.korapay.com/merchant/api/v1';
  private static PUBLIC_KEY = config.payment.korapay.publicKey;
  private static SECRET_KEY = config.payment.korapay.secretKey;
  private static CALLBACK_URL = config.payment.korapay.callbackUrl;
  
  /**
   * Generate a unique transaction reference
   */
  static generateReference(): string {
    return `TX-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }
  
  /**
   * Helper method to get the appropriate headers for each endpoint
   */
  private static getHeaders(usePublicKey: boolean = false): Record<string, string> {
    return {
      'Authorization': `Bearer ${usePublicKey ? this.PUBLIC_KEY : this.SECRET_KEY}`,
      'Content-Type': 'application/json'
    };
  }
  
  /**
   * Process a direct card payment
   * @param amount Amount in Naira
   * @param email Customer email
   * @param name Customer name
   * @param cardNumber Card number
   * @param cardExpiry Card expiry in MM/YY format
   * @param cardCvv Card CVV
   * @param cryptoAmount Amount of crypto to buy
   * @param cryptoType Type of crypto (ETH, BTC)
   * @param walletAddress User's wallet address
   * @returns Payment status and reference
   */
  static async processCardPayment(
    amount: string,
    email: string,
    name: string,
    cardNumber: string,
    cardExpiry: string,
    cardCvv: string,
    cryptoAmount: string,
    cryptoType: string,
    walletAddress: string
  ): Promise<{ status: 'success' | 'pending' | 'failed'; reference: string }> {
    try {
      const reference = this.generateReference();
      
      // Parse card expiry
      const [expiryMonth, expiryYear] = cardExpiry.split('/');
      
      const payload = {
        reference,
        amount,
        currency: 'NGN',
        customer: {
          name,
          email
        },
        notification_url: this.CALLBACK_URL,
        card: {
          number: cardNumber.replace(/\s/g, ''),
          expiry_month: expiryMonth,
          expiry_year: expiryYear,
          cvv: cardCvv
        },
        metadata: {
          crypto_amount: cryptoAmount,
          crypto_type: cryptoType,
          wallet_address: walletAddress
        }
      };
      
      console.log('Card payment payload:', JSON.stringify(payload, null, 2));
      
      const response = await axios.post<KorapayDirectChargeResponse>(
        `${this.BASE_URL}/charges/card`,
        payload,
        {
          headers: this.getHeaders()
        }
      );
      
      if (!response.data.status) {
        throw new Error(response.data.message || 'Failed to process card payment');
      }
      
      return {
        status: response.data.data.status,
        reference: response.data.data.reference
      };
    } catch (error) {
      console.error('Error processing Korapay card payment:', error);
      throw new Error('Failed to process card payment');
    }
  }
  
  /**
   * Process a bank transfer payment
   * @param amount Amount in Naira
   * @param email Customer email
   * @param name Customer name
   * @param bankCode Bank code
   * @param accountNumber Account number
   * @param cryptoAmount Amount of crypto to buy
   * @param cryptoType Type of crypto (ETH, BTC)
   * @param walletAddress User's wallet address
   * @returns Payment status and reference
   */
  static async processBankTransfer(
    amount: string,
    email: string,
    name: string,
    bankCode: string,
    accountNumber: string,
    cryptoAmount: string,
    cryptoType: string,
    walletAddress: string
  ): Promise<{ status: 'success' | 'pending' | 'failed'; reference: string }> {
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
        bank: {
          code: bankCode,
          account_number: accountNumber
        },
        metadata: {
          crypto_amount: cryptoAmount,
          crypto_type: cryptoType,
          wallet_address: walletAddress
        }
      };
      
      const response = await axios.post<KorapayDirectChargeResponse>(
        `${this.BASE_URL}/charges/bank-transfer`,
        payload,
        {
          headers: this.getHeaders()
        }
      );
      
      if (!response.data.status) {
        throw new Error(response.data.message || 'Failed to process bank transfer');
      }
      
      return {
        status: response.data.data.status,
        reference: response.data.data.reference
      };
    } catch (error) {
      console.error('Error processing Korapay bank transfer:', error);
      throw new Error('Failed to process bank transfer');
    }
  }
  
  /**
   * Get available banks for payment
   * @returns List of banks with their codes
   */
  static async getBanks(): Promise<Array<{ name: string; code: string }>> {
    try {
      console.log('Fetching banks from Korapay...');
      
      const response = await axios.get(
        `${this.BASE_URL}/misc/banks`,
        {
          headers: this.getHeaders(true)
        }
      );
      
      console.log('Banks API response status:', response.status);
      
      if (!response.data.status) {
        console.error('Korapay API error:', response.data);
        throw new Error(response.data.message || 'Failed to fetch banks');
      }
      
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Axios error fetching banks:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
      } else {
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
  static async verifyPayment(reference: string): Promise<{
    status: 'success' | 'pending' | 'failed';
    amount: string;
    metadata: any;
  }> {
    try {
      const response = await axios.get<KorapayVerifyPaymentResponse>(
        `${this.BASE_URL}/transactions/verify/${reference}`,
        {
          headers: this.getHeaders()
        }
      );
      
      if (!response.data.status) {
        throw new Error(response.data.message || 'Failed to verify payment');
      }
      
      return {
        status: response.data.data.status,
        amount: response.data.data.amount,
        metadata: response.data.data
      };
    } catch (error) {
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
  static validateWebhookSignature(signature: string, payload: string): boolean {
    try {
      console.log('=== VALIDATING WEBHOOK SIGNATURE ===');
      console.log('Secret key used:', this.SECRET_KEY.substring(0, 5) + '...');
      
      // Create HMAC using SHA512 and the secret key
      const hmac = crypto.createHmac('sha512', this.SECRET_KEY);
      
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
          const altHmac = crypto.createHmac('sha512', alternativeKey);
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
    } catch (error) {
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
  static async initializeCheckout(
amount: string, email: string, name: string, cryptoAmount: string, cryptoType: string, walletAddress: string, p0: { crypto_type: any; wallet_address: any; crypto_amount: string; }, p1: null  ): Promise<{ checkout_url: string; reference: string }> {
    try {
      const reference = this.generateReference();
      
      // Use both the regular webhook URL and the debug endpoint
      const regularWebhookUrl = this.CALLBACK_URL;
      const debugWebhookUrl = `${config.payment.korapay.callbackUrl.replace('/api/payment/webhook', '/debug/log')}`;
      
      // Choose which webhook URL to use
      // For testing, we'll use the debug endpoint
      const webhookUrl = debugWebhookUrl;
      
      console.log('Using webhook URL:', webhookUrl);
      
      const payload = {
        reference,
        amount,
        currency: 'NGN',
        customer: {
          name,
          email
        },
        notification_url: webhookUrl,
        redirect_url: `${config.app.baseUrl}/api/payment/success`,
        channels: ['card', 'bank_transfer', 'mobile_money'], // Add mobile_money as a payment channel
        metadata: {
          crypto_amount: cryptoAmount,
          crypto_type: cryptoType,
          wallet_address: walletAddress
        }
      };
      
      console.log('Checkout initialization payload:', JSON.stringify(payload, null, 2));
      
      const response = await axios.post(
        `${this.BASE_URL}/charges/initialize`,
        payload,
        {
          headers: this.getHeaders()
        }
      );
      
      if (!response.data.status) {
        throw new Error(response.data.message || 'Failed to initialize checkout');
      }
      
      return {
        checkout_url: response.data.data.checkout_url,
        reference: response.data.data.reference
      };
    } catch (error) {
      console.error('Error initializing Korapay checkout:', error);
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
  static async processMobileMoneyPayment(
    amount: string,
    email: string,
    name: string,
    mobileNumber: string,
    provider: string,
    cryptoAmount: string,
    cryptoType: string,
    walletAddress: string
  ): Promise<{ status: string; reference: string }> {
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
      
      const response = await axios.post<KorapayDirectChargeResponse>(
        `${this.BASE_URL}/charges/mobile-money`,
        payload,
        {
          headers: this.getHeaders()
        }
      );
      
      if (!response.data.status) {
        throw new Error(response.data.message || 'Failed to process mobile money payment');
      }
      
      return {
        status: response.data.data.status,
        reference: response.data.data.reference
      };
    } catch (error) {
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
  static async verifyBankAccount(
    accountNumber: string,
    bankCode: string
  ): Promise<{
    account_number: string;
    account_name: string;
    bank_code: string;
    bank_name: string;
  }> {
    try {
      console.log(`Verifying bank account: ${accountNumber}, bank code: ${bankCode}`);
      
      // Fix the URL to use the correct endpoint
      const response = await axios.get(
        `https://api.korapay.com/merchant/api/v1/banks/resolve?account_number=${accountNumber}&bank=${bankCode}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.payment.korapay.secretKey}`
          }
        }
      );
      
      if (response.status === 200 && response.data.status) {
        return {
          account_number: response.data.data.account_number,
          account_name: response.data.data.account_name,
          bank_code: bankCode,
          bank_name: response.data.data.bank_name || ''
        };
      }
      
      throw new Error(response.data.message || 'Failed to verify bank account');
    } catch (error) {
      console.error('Error verifying bank account:', error);
      throw new Error('Failed to verify bank account');
    }
  }

  /**
   * Process bank payout
   * @param payoutData Payout data
   * @returns Payout response
   */
  static async processBankPayout(payoutData: {
    amount: string;
    bank_code: string;
    account_number: string;
    account_name: string;
    narration: string;
    reference: string;
  }): Promise<any> {
    try {
      console.log('Processing bank payout:', payoutData);
      
      const response = await axios.post(
        'https://api.korapay.com/merchant/api/v1/transactions/disburse',
        {
          reference: payoutData.reference,
          destination: {
            type: 'bank_account',
            amount: payoutData.amount,
            currency: 'NGN',
            bank_account: {
              bank: payoutData.bank_code,
              account: payoutData.account_number,
              name: payoutData.account_name
            },
            narration: payoutData.narration
          },
          callback_url: config.payment.korapay.callbackUrl
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.payment.korapay.secretKey}`
          }
        }
      );
      
      console.log('Payout response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('Error processing bank payout:', error);
      if (axios.isAxiosError(error) && error.response) {
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
  static async checkPayoutStatus(reference: string): Promise<any> {
    try {
      const response = await axios.get(
        `https://api.korapay.com/merchant/api/v1/transactions/disburse/${reference}`,
        {
          headers: {
            'Authorization': `Bearer ${config.payment.korapay.secretKey}`
          }
        }
      );
      
      return response.data.data;
    } catch (error) {
      console.error('Error checking payout status:', error);
      if (axios.isAxiosError(error) && error.response) {
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
  static async pollPaymentStatus(
    reference: string,
    maxAttempts: number = 20,
    intervalMs: number = 3000
  ): Promise<KorapayVerifyPaymentResponse['data']> {
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
          const result: KorapayVerifyPaymentResponse['data'] = {
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
      } catch (error) {
        console.error(`Error polling payment status (attempt ${attempts}):`, error);
        // Continue polling despite errors
      }
    }
    
    throw new Error(`Payment verification timed out after ${maxAttempts} attempts`);
  }

  /**
   * Initialize payment with Korapay
   */
  static async initializePayment(data: PaymentInitData) {
    try {
      const response = await axios.post(
        `${this.BASE_URL}/charges/initialize`,
        {
          amount: data.amount,
          currency: data.currency,
          reference: data.reference,
          notification_url: config.payment.korapay.callbackUrl,
          redirect_url: data.redirectUrl,
          customer: {
            email: data.customerEmail,
            name: data.customerName
          },
          metadata: data.metadata
        },
        {
          headers: {
            'Authorization': `Bearer ${this.SECRET_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.data;
    } catch (error) {
      console.error('Error initializing payment:', error);
      throw new Error('Failed to initialize payment');
    }
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhook(req: Request): boolean {
    try {
      const signature = req.headers['x-korapay-signature'] as string;
      if (!signature) {
        return false;
      }
      
      const payload = JSON.stringify(req.body);
      const hash = crypto
        .createHmac('sha256', this.SECRET_KEY)
        .update(payload)
        .digest('hex');
      
      return hash === signature;
    } catch (error) {
      console.error('Error verifying webhook:', error);
      return false;
    }
  }
  
  /**
   * Process successful payment
   */
  static async processSuccessfulPayment(reference: string): Promise<boolean> {
    try {
      // Get transaction from database
      const transaction = await DatabaseService.getTransactionByReference(reference);
      if (!transaction) {
        console.error(`Transaction not found for reference: ${reference}`);
        return false;
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
      return true;
    } catch (error) {
      console.error('Error processing successful payment:', error);
      return false;
    }
  }
} 