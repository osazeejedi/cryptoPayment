import { Wallet } from '../types/database';
export declare class WalletService {
    static getUserWallet(userId: string, walletAddress: string, walletPrivateKey: string): Promise<{
        address: string;
        privateKey: string;
    }>;
    static checkUserBalance(balance: string, amount: string): boolean;
    static getCompanyWallet(): {
        address: string;
        privateKey: string;
    };
    /**
     * Generate a new Ethereum wallet
     * @returns Object containing address and private key
     */
    static generateWallet(): Promise<{
        address: string;
        privateKey: string;
    }>;
    /**
     * Create a new wallet for a user
     * @param userId User ID
     * @param cryptoType Cryptocurrency type
     * @param label Optional label for the wallet
     * @returns Created wallet or null
     */
    static createWalletForUser(userId: string, cryptoType: string, label?: string): Promise<Wallet | null>;
    /**
     * Get wallet balance using BlockCypher
     * @param address Wallet address
     * @param cryptoType Cryptocurrency type
     * @returns Wallet balance as string
     */
    static getWalletBalance(address: string, cryptoType: string): Promise<string>;
    /**
     * Get wallet transaction history using BlockCypher
     * @param address Wallet address
     * @param limit Number of transactions to return
     * @returns Array of transactions
     */
    static getWalletTransactions(address: string, limit?: number): Promise<any[]>;
    /**
     * Verify a wallet address using BlockCypher
     * @param address Wallet address to verify
     * @returns Boolean indicating if address is valid
     */
    static verifyAddress(address: string): Promise<boolean>;
    static checkWalletExistence(address: string): Promise<boolean>;
}
