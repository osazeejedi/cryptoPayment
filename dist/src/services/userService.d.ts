import { Wallet } from '../types/database';
export declare class UserService {
    /**
     * Create a new wallet for a user
     * @param userId User ID
     * @param cryptoType Cryptocurrency type
     * @param label Optional label for the wallet
     * @returns Created wallet or null
     */
    static createWalletForUser(userId: string, cryptoType: string, label?: string): Promise<Wallet | null>;
    /**
     * Get user profile with wallets
     * @param userId User ID
     * @returns User profile with wallets
     */
    static getUserProfile(userId: string): Promise<any>;
    /**
     * Create a new user with a default wallet
     * @param userData User data
     * @returns Created user with wallet
     */
    static createUserWithWallet(userData: {
        id: string;
        email: string;
        full_name?: string;
        phone_number?: string;
    }): Promise<any>;
}
