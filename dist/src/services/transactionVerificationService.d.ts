export declare class TransactionVerificationService {
    /**
     * Verify a payment transaction using multiple methods
     * @param reference Payment reference
     * @returns Verification result
     */
    static verifyPayment(reference: string): Promise<{
        status: 'success' | 'pending' | 'failed';
        transaction: any;
        payment: any;
    }>;
    /**
     * Verify a transaction on the blockchain
     */
    static verifyTransaction(transactionId: string): Promise<boolean>;
    /**
     * Process pending transactions
     */
    static processPendingTransactions(): Promise<void>;
}
