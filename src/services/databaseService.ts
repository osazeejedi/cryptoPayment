import { supabase } from '../../config/supabase';
import { User, Transaction, Wallet } from '../types/database';
import { v4 as uuidv4 } from 'uuid';

export class DatabaseService {
  /**
   * Get user by ID
   * @param userId User ID
   * @returns User object or null
   */
  static async getUserById(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }
  
  /**
   * Get user by email
   * @param email User email
   * @returns User object or null
   */
  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - user not found
          return null;
        }
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }
  
  /**
   * Create a new wallet for a user
   * @param wallet Wallet object
   * @returns Created wallet or null
   */
  static async createWallet(wallet: Omit<Wallet, 'id' | 'created_at'>): Promise<Wallet | null> {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .insert([wallet])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating wallet:', error);
      return null;
    }
  }
  
  /**
   * Get user wallets
   * @param userId User ID
   * @returns Array of wallets
   */
  static async getUserWallets(userId: string): Promise<Wallet[]> {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user wallets:', error);
      return [];
    }
  }
  
  /**
   * Get wallet by address
   * @param address Wallet address
   * @returns Wallet object or null
   */
  static async getWalletByAddress(address: string): Promise<Wallet | null> {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('address', address)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting wallet by address:', error);
      return null;
    }
  }
  
  /**
   * Create a new transaction
   * @param transaction Transaction data
   * @returns Created transaction or null
   */
  static async createTransaction(
    transaction: Omit<Transaction, 'id' | 'created_at'>
  ): Promise<Transaction | null> {
    try {
      console.log('Creating transaction:', transaction);
      
      const { data, error } = await supabase
        .from('transactions')
        .insert(transaction)
        .select('*')
        .single();
      
      if (error) {
        console.error('Error creating transaction:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error creating transaction:', error);
      return null;
    }
  }
  
  /**
   * Get user transactions
   * @param userId User ID
   * @param limit Number of transactions to return
   * @param offset Offset for pagination
   * @returns Array of transactions
   */
  static async getUserTransactions(userId: string, limit: number = 10, offset: number = 0): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user transactions:', error);
      return [];
    }
  }
  
  /**
   * Get transaction by ID
   * @param transactionId Transaction ID
   * @returns Transaction object or null
   */
  static async getTransactionById(transactionId: string): Promise<Transaction | null> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting transaction by ID:', error);
      return null;
    }
  }
  
  /**
   * Get transaction by blockchain hash
   * @param txHash Blockchain transaction hash
   * @returns Transaction object or null
   */
  static async getTransactionByHash(txHash: string): Promise<Transaction | null> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('blockchain_tx_hash', txHash)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting transaction by hash:', error);
      return null;
    }
  }
  
  /**
   * Update transaction status
   * @param transactionId Transaction ID
   * @param status New status
   * @param blockchainTxHash Optional blockchain transaction hash
   * @returns Updated transaction or null
   */
  static async updateTransactionStatus(
    transactionId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    blockchainTxHash?: string
  ): Promise<Transaction | null> {
    try {
      const updateData: Partial<Transaction> = { 
        status: status as 'pending' | 'completed' | 'failed' 
      };
      
      if (blockchainTxHash) {
        updateData.blockchain_tx_hash = blockchainTxHash;
      }
      
      const { data, error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', transactionId)
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating transaction status:', error);
      return null;
    }
  }
  
  /**
   * Update a transaction with additional data
   * @param transactionId Transaction ID
   * @param updateData Data to update
   * @returns Updated transaction or null
   */
  static async updateTransaction(
    transactionId: string, 
    updateData: Partial<Transaction>
  ): Promise<Transaction | null> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', transactionId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating transaction:', error);
      return null;
    }
  }
  
  /**
   * Get transaction by payment reference
   * @param reference Payment reference
   * @returns Transaction object or null
   */
  static async getTransactionByReference(reference: string): Promise<Transaction | null> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('payment_reference', reference)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting transaction by reference:', error);
      return null;
    }
  }
  
  /**
   * Get pending transactions older than a specific time
   * @param olderThan ISO timestamp
   * @returns Array of pending transactions
   */
  static async getPendingTransactions(olderThan: string): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('status', 'pending')
        .lt('created_at', olderThan)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting pending transactions:', error);
      return [];
    }
  }
  
  /**
   * Create a new user
   * @param userData User data
   * @returns Created user or null
   */
  static async createUser(userData: Omit<User, 'id' | 'created_at'>): Promise<User | null> {
    try {
      // Generate a UUID for the user
      const userId = uuidv4();
      
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: userId,
          ...userData
        })
        .select('*')
        .single();
      
      if (error) {
        console.error('Error creating user:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  }
} 