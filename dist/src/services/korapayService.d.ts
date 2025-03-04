import { Request } from 'express';
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
export declare class KorapayService {
    private static BASE_URL;
    private static PUBLIC_KEY;
    private static SECRET_KEY;
    private static CALLBACK_URL;
    /**
     * Generate a unique transaction reference
     */
    static generateReference(): string;
    /**
     * Helper method to get the appropriate headers for each endpoint
     */
    private static getHeaders;
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
    static processCardPayment(amount: string, email: string, name: string, cardNumber: string, cardExpiry: string, cardCvv: string, cryptoAmount: string, cryptoType: string, walletAddress: string): Promise<{
        status: 'success' | 'pending' | 'failed';
        reference: string;
    }>;
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
    static processBankTransfer(amount: string, email: string, name: string, bankCode: string, accountNumber: string, cryptoAmount: string, cryptoType: string, walletAddress: string): Promise<{
        status: 'success' | 'pending' | 'failed';
        reference: string;
    }>;
    /**
     * Get available banks for payment
     * @returns List of banks with their codes
     */
    static getBanks(): Promise<Array<{
        name: string;
        code: string;
    }>>;
    /**
     * Verify a payment transaction
     * @param reference Transaction reference
     * @returns Payment verification details
     */
    static verifyPayment(reference: string): Promise<{
        status: 'success' | 'pending' | 'failed';
        amount: string;
        metadata: any;
    }>;
    /**
     * Validate a webhook signature from Korapay
     * @param signature The signature from the X-Korapay-Signature header
     * @param payload The request body as a string
     * @returns Whether the signature is valid
     */
    static validateWebhookSignature(signature: string, payload: string): boolean;
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
    static initializeCheckout(amount: string, email: string, name: string, cryptoAmount: string, cryptoType: string, walletAddress: string): Promise<{
        checkout_url: string;
        reference: string;
    }>;
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
    static processMobileMoneyPayment(amount: string, email: string, name: string, mobileNumber: string, provider: string, cryptoAmount: string, cryptoType: string, walletAddress: string): Promise<{
        status: string;
        reference: string;
    }>;
    /**
     * Verify a bank account
     * @param accountNumber Account number to verify
     * @param bankCode Bank code
     * @returns Account details if verification is successful
     */
    static verifyBankAccount(accountNumber: string, bankCode: string): Promise<{
        account_number: string;
        account_name: string;
        bank_code: string;
        bank_name: string;
    }>;
    /**
     * Process bank payout
     * @param payoutData Payout data
     * @returns Payout response
     */
    static processBankPayout(payoutData: {
        amount: string;
        bank_code: string;
        account_number: string;
        account_name: string;
        narration: string;
        reference: string;
    }): Promise<any>;
    /**
     * Check payout status
     * @param reference Payout reference
     * @returns Payout status
     */
    static checkPayoutStatus(reference: string): Promise<any>;
    /**
     * Poll for payment status
     * @param reference Payment reference
     * @param maxAttempts Maximum number of polling attempts
     * @param intervalMs Interval between attempts in milliseconds
     * @returns Final payment status
     */
    static pollPaymentStatus(reference: string, maxAttempts?: number, intervalMs?: number): Promise<KorapayVerifyPaymentResponse['data']>;
    /**
     * Initialize payment with Korapay
     */
    static initializePayment(data: PaymentInitData): Promise<any>;
    /**
     * Verify webhook signature
     */
    static verifyWebhook(req: Request): boolean;
    /**
     * Process successful payment
     */
    static processSuccessfulPayment(reference: string): Promise<boolean>;
}
export {};
