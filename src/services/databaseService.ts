import { supabase } from '../../config/supabase';
import { User, Transaction, Wallet } from '../types/database';
import { v4 as uuidv4 } from 'uuid';

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

export class DatabaseService {
  static supabase = supabase;

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
   */
  static async createTransaction(data: TransactionData): Promise<any> {
    try {
      // Map from TransactionData to database schema
      const dbData = {
        user_id: data.user_id,
        transaction_type: data.transaction_type || 'buy',
        status: data.status,
        amount: data.amount,
        crypto_type: data.cryptoType,
        to_address: data.walletAddress || data.to_address,
        payment_method: data.paymentMethod,
        fiat_amount: data.fiat_amount,
        fiat_currency: data.fiat_currency
      };

      const { data: transaction, error } = await supabase
        .from('transactions')
        .insert(dbData)
        .select()
        .single();

      if (error) throw error;
      
      // Map from database schema to TransactionData
      return {
        id: transaction.id,
        amount: transaction.amount,
        cryptoAmount: transaction.amount,
        cryptoType: transaction.crypto_type,
        walletAddress: transaction.to_address,
        status: transaction.status,
        paymentMethod: transaction.payment_method,
        blockchainTxHash: transaction.blockchain_tx_hash,
        paymentReference: transaction.payment_reference,
        notes: transaction.notes,
        createdAt: transaction.created_at,
        updatedAt: transaction.updated_at
      };
    } catch (error) {
      console.error('Error creating transaction:', error);
      return null;
    }
  }
  
  /**
   * Get transaction by ID
   */
  static async getTransaction(id: string) {
    const { data: transaction, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error getting transaction:', error);
      return null;
    }
    
    return {
      id: transaction.id,
      user_id: transaction.user_id,
      amount: transaction.amount,
      cryptoAmount: transaction.amount,
      cryptoType: transaction.crypto_type,
      walletAddress: transaction.to_address,
      status: transaction.status,
      paymentMethod: transaction.payment_method,
      blockchainTxHash: transaction.blockchain_tx_hash,
      paymentReference: transaction.payment_reference,
      notes: transaction.notes,
      createdAt: transaction.created_at,
      updatedAt: transaction.updated_at,
      transaction_type: transaction.transaction_type,
      fiat_amount: transaction.fiat_amount,
      fiat_currency: transaction.fiat_currency
    };
  }
  
  /**
   * Get transaction by reference (same as ID in this case)
   */
  static async getTransactionByReference(reference: string) {
    return this.getTransaction(reference);
  }
  
  /**
   * Update transaction
   */
  static async updateTransaction(id: string, data: Partial<TransactionData>) {
    const updateData: any = {};
    
    if (data.status) updateData.status = data.status;
    if (data.blockchainTxHash) updateData.blockchain_tx_hash = data.blockchainTxHash;
    if (data.paymentReference) updateData.payment_reference = data.paymentReference;
    if (data.notes) updateData.notes = data.notes;
    
    const { data: transaction, error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating transaction:', error);
      throw new Error('Failed to update transaction');
    }
    
    return {
      id: transaction.id,
      amount: transaction.amount,
      cryptoAmount: transaction.crypto_amount,
      cryptoType: transaction.crypto_type,
      walletAddress: transaction.wallet_address,
      status: transaction.status,
      paymentMethod: transaction.payment_method,
      blockchainTxHash: transaction.blockchain_tx_hash,
      paymentReference: transaction.payment_reference,
      notes: transaction.notes,
      createdAt: transaction.created_at,
      updatedAt: transaction.updated_at
    };
  }
  
  /**
   * Get transactions by status
   */
  static async getTransactionsByStatus(status: string) {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('status', status);
    
    if (error) {
      console.error('Error getting transactions by status:', error);
      return [];
    }
    
    return transactions.map(transaction => ({
      id: transaction.id,
      amount: transaction.amount,
      cryptoAmount: transaction.crypto_amount,
      cryptoType: transaction.crypto_type,
      walletAddress: transaction.wallet_address,
      status: transaction.status,
      paymentMethod: transaction.payment_method,
      blockchainTxHash: transaction.blockchain_tx_hash,
      paymentReference: transaction.payment_reference,
      notes: transaction.notes,
      createdAt: transaction.created_at,
      updatedAt: transaction.updated_at
    }));
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