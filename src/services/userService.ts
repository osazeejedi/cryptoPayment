import { DatabaseService } from './databaseService';
import { User, Wallet } from '../types/database';
import { WalletService } from './walletService';

export class UserService {
  /**
   * Create a new wallet for a user
   * @param userId User ID
   * @param cryptoType Cryptocurrency type
   * @param label Optional label for the wallet
   * @returns Created wallet or null
   */
  static async createWalletForUser(
    userId: string,
    cryptoType: string,
    label?: string
  ): Promise<Wallet | null> {
    return WalletService.createWalletForUser(userId, cryptoType, label);
  }
  
  /**
   * Get user profile with wallets
   * @param userId User ID
   * @returns User profile with wallets
   */
  static async getUserProfile(userId: string): Promise<any> {
    try {
      // Get user
      const user = await DatabaseService.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Get user wallets
      const wallets = await DatabaseService.getUserWallets(userId);
      
      // Get wallet balances
      const walletsWithBalances = await Promise.all(
        wallets.map(async (wallet) => {
          try {
            const balance = await WalletService.getWalletBalance(
              wallet.address,
              wallet.crypto_type
            );
            
            return {
              ...wallet,
              balance,
              private_key: undefined // Don't expose private key
            };
          } catch (error) {
            console.error(`Error getting balance for wallet ${wallet.address}:`, error);
            return {
              ...wallet,
              balance: '0',
              private_key: undefined // Don't expose private key
            };
          }
        })
      );
      
      // Get recent transactions
      const recentTransactions = await DatabaseService.getUserTransactions(userId, 5);
      
      return {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          phone_number: user.phone_number
        },
        wallets: walletsWithBalances,
        recent_transactions: recentTransactions
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }
  
  /**
   * Create a new user with a default wallet
   * @param userData User data
   * @returns Created user with wallet
   */
  static async createUserWithWallet(userData: {
    id: string;
    email: string;
    full_name?: string;
    phone_number?: string;
  }): Promise<any> {
    try {
      // Check if user already exists
      const existingUser = await DatabaseService.getUserById(userData.id);
      if (existingUser) {
        throw new Error('User already exists');
      }
      
      // Create user in database (this would typically be handled by Supabase Auth)
      // For testing purposes, we'll simulate this
      const { data: user, error } = await DatabaseService.supabase
        .from('users')
        .insert([{
          id: userData.id,
          email: userData.email,
          full_name: userData.full_name,
          phone_number: userData.phone_number
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Create default ETH wallet
      const ethWallet = await WalletService.createWalletForUser(
        userData.id,
        'ETH',
        'Default ETH Wallet'
      );
      
      // Create default USDT wallet
      const usdtWallet = await WalletService.createWalletForUser(
        userData.id,
        'USDT',
        'Default USDT Wallet'
      );
      
      return {
        user,
        wallets: [
          ethWallet ? {
            ...ethWallet,
            private_key: undefined // Don't expose private key
          } : null,
          usdtWallet ? {
            ...usdtWallet,
            private_key: undefined // Don't expose private key
          } : null
        ].filter(Boolean)
      };
    } catch (error) {
      console.error('Error creating user with wallet:', error);
      throw error;
    }
  }
} 