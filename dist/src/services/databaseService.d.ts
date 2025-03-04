import { User, Transaction, Wallet } from '../types/database';
interface TransactionData {
    id?: string;
    amount: string;
    cryptoAmount: string;
    cryptoType: string;
    walletAddress: string;
    status: string;
    paymentMethod: string;
    blockchainTxHash?: string;
    paymentReference?: string;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
    user_id: string;
    transaction_type?: string;
    fiat_amount?: string;
    fiat_currency?: string;
    to_address?: string;
}
export declare class DatabaseService {
    /**
     * Get user by ID
     * @param userId User ID
     * @returns User object or null
     */
    static getUserById(userId: string): Promise<User | null>;
    /**
     * Get user by email
     * @param email User email
     * @returns User object or null
     */
    static getUserByEmail(email: string): Promise<User | null>;
    /**
     * Create a new wallet for a user
     * @param wallet Wallet object
     * @returns Created wallet or null
     */
    static createWallet(wallet: Omit<Wallet, 'id' | 'created_at'>): Promise<Wallet | null>;
    /**
     * Get user wallets
     * @param userId User ID
     * @returns Array of wallets
     */
    static getUserWallets(userId: string): Promise<Wallet[]>;
    /**
     * Get wallet by address
     * @param address Wallet address
     * @returns Wallet object or null
     */
    static getWalletByAddress(address: string): Promise<Wallet | null>;
    /**
     * Create a new transaction
     */
    static createTransaction(data: TransactionData): Promise<any>;
    /**
     * Get transaction by ID
     */
    static getTransaction(id: string): Promise<{
        id: any;
        user_id: any;
        amount: any;
        cryptoAmount: any;
        cryptoType: any;
        walletAddress: any;
        status: any;
        paymentMethod: any;
        blockchainTxHash: any;
        paymentReference: any;
        notes: any;
        createdAt: any;
        updatedAt: any;
        transaction_type: any;
        fiat_amount: any;
        fiat_currency: any;
    } | null>;
    /**
     * Get transaction by reference (same as ID in this case)
     */
    static getTransactionByReference(reference: string): Promise<{
        id: any;
        user_id: any;
        amount: any;
        cryptoAmount: any;
        cryptoType: any;
        walletAddress: any;
        status: any;
        paymentMethod: any;
        blockchainTxHash: any;
        paymentReference: any;
        notes: any;
        createdAt: any;
        updatedAt: any;
        transaction_type: any;
        fiat_amount: any;
        fiat_currency: any;
    } | null>;
    /**
     * Update transaction
     */
    static updateTransaction(id: string, data: Partial<TransactionData>): Promise<{
        id: any;
        amount: any;
        cryptoAmount: any;
        cryptoType: any;
        walletAddress: any;
        status: any;
        paymentMethod: any;
        blockchainTxHash: any;
        paymentReference: any;
        notes: any;
        createdAt: any;
        updatedAt: any;
    }>;
    /**
     * Get transactions by status
     */
    static getTransactionsByStatus(status: string): Promise<{
        id: any;
        amount: any;
        cryptoAmount: any;
        cryptoType: any;
        walletAddress: any;
        status: any;
        paymentMethod: any;
        blockchainTxHash: any;
        paymentReference: any;
        notes: any;
        createdAt: any;
        updatedAt: any;
    }[]>;
    /**
     * Get user transactions
     * @param userId User ID
     * @param limit Number of transactions to return
     * @param offset Offset for pagination
     * @returns Array of transactions
     */
    static getUserTransactions(userId: string, limit?: number, offset?: number): Promise<Transaction[]>;
    /**
     * Get transaction by blockchain hash
     * @param txHash Blockchain transaction hash
     * @returns Transaction object or null
     */
    static getTransactionByHash(txHash: string): Promise<Transaction | null>;
    /**
     * Get pending transactions older than a specific time
     * @param olderThan ISO timestamp
     * @returns Array of pending transactions
     */
    static getPendingTransactions(olderThan: string): Promise<Transaction[]>;
    /**
     * Create a new user
     * @param userData User data
     * @returns Created user or null
     */
    static createUser(userData: Omit<User, 'id' | 'created_at'>): Promise<User | null>;
}
export {};
