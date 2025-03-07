"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const supabase_1 = require("../../config/supabase");
const uuid_1 = require("uuid");
class DatabaseService {
    /**
     * Get user by ID
     * @param userId User ID
     * @returns User object or null
     */
    static async getUserById(userId) {
        try {
            const { data, error } = await supabase_1.supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();
            if (error) {
                console.error('Error fetching user:', error);
                return null;
            }
            return data;
        }
        catch (error) {
            console.error('Error in getUserById:', error);
            return null;
        }
    }
    /**
     * Get user by email
     * @param email User email
     * @returns User object or null
     */
    static async getUserByEmail(email) {
        try {
            const { data, error } = await supabase_1.supabase
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
        }
        catch (error) {
            console.error('Error getting user by email:', error);
            return null;
        }
    }
    /**
     * Create a new wallet
     * @param walletData Wallet data
     * @returns Created wallet or null if failed
     */
    static async createWallet(walletData) {
        try {
            const { data, error } = await supabase_1.supabase
                .from('wallets')
                .insert([walletData])
                .select()
                .single();
            if (error) {
                console.error('Error creating wallet:', error);
                return null;
            }
            return data;
        }
        catch (error) {
            console.error('Error in createWallet:', error);
            return null;
        }
    }
    /**
     * Get all wallets for a user
     * @param userId User ID
     * @returns Array of wallets
     */
    static async getUserWallets(userId) {
        try {
            const { data, error } = await supabase_1.supabase
                .from('wallets')
                .select('*')
                .eq('user_id', userId);
            if (error) {
                console.error('Error fetching user wallets:', error);
                return [];
            }
            return data;
        }
        catch (error) {
            console.error('Error in getUserWallets:', error);
            return [];
        }
    }
    /**
     * Get wallet by address
     * @param address Wallet address
     * @returns Wallet object or null
     */
    static async getWalletByAddress(address) {
        try {
            const { data, error } = await supabase_1.supabase
                .from('wallets')
                .select('*')
                .eq('address', address)
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            console.error('Error getting wallet by address:', error);
            return null;
        }
    }
    /**
     * Create a new transaction
     */
    static async createTransaction(data) {
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
            const { data: transaction, error } = await supabase_1.supabase
                .from('transactions')
                .insert(dbData)
                .select()
                .single();
            if (error)
                throw error;
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
        }
        catch (error) {
            console.error('Error creating transaction:', error);
            return null;
        }
    }
    /**
     * Get transaction by ID
     */
    static async getTransaction(id) {
        const { data: transaction, error } = await supabase_1.supabase
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
    static async getTransactionByReference(reference, p0) {
        return this.getTransaction(reference);
    }
    /**
     * Update transaction
     */
    static async updateTransaction(id, data) {
        const updateData = {};
        if (data.status)
            updateData.status = data.status;
        if (data.blockchainTxHash)
            updateData.blockchain_tx_hash = data.blockchainTxHash;
        if (data.paymentReference)
            updateData.payment_reference = data.paymentReference;
        if (data.notes)
            updateData.notes = data.notes;
        const { data: transaction, error } = await supabase_1.supabase
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
    static async getTransactionsByStatus(status) {
        const { data: transactions, error } = await supabase_1.supabase
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
    static async getUserTransactions(userId, limit = 10, offset = 0) {
        try {
            const { data, error } = await supabase_1.supabase
                .from('transactions')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);
            if (error)
                throw error;
            return data || [];
        }
        catch (error) {
            console.error('Error getting user transactions:', error);
            return [];
        }
    }
    /**
     * Get transaction by blockchain hash
     * @param txHash Blockchain transaction hash
     * @returns Transaction object or null
     */
    static async getTransactionByHash(txHash) {
        try {
            const { data, error } = await supabase_1.supabase
                .from('transactions')
                .select('*')
                .eq('blockchain_tx_hash', txHash)
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            console.error('Error getting transaction by hash:', error);
            return null;
        }
    }
    /**
     * Get pending transactions older than a specific time
     * @param olderThan ISO timestamp
     * @returns Array of pending transactions
     */
    static async getPendingTransactions(olderThan) {
        try {
            const { data, error } = await supabase_1.supabase
                .from('transactions')
                .select('*')
                .eq('status', 'pending')
                .lt('created_at', olderThan)
                .order('created_at', { ascending: true });
            if (error)
                throw error;
            return data || [];
        }
        catch (error) {
            console.error('Error getting pending transactions:', error);
            return [];
        }
    }
    /**
     * Create a new user
     * @param userData User data
     * @returns Created user or null
     */
    static async createUser(userData) {
        try {
            // Generate a UUID for the user
            const userId = (0, uuid_1.v4)();
            const { data, error } = await supabase_1.supabase
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
        }
        catch (error) {
            console.error('Error creating user:', error);
            return null;
        }
    }
    /**
     * Get user profile with wallets
     * @param userId User ID
     * @returns User profile with wallets
     */
    static async getUserProfile(userId) {
        try {
            // Get user data
            const { data: user, error: userError } = await supabase_1.supabase
                .from('users')
                .select('id, email, name, created_at, updated_at, profile_image, phone_number, is_verified')
                .eq('id', userId)
                .single();
            if (userError) {
                throw new Error(`Error fetching user: ${userError.message}`);
            }
            // Get user's wallets
            const { data: wallets, error: walletsError } = await supabase_1.supabase
                .from('wallets')
                .select('*')
                .eq('user_id', userId);
            if (walletsError) {
                throw new Error(`Error fetching wallets: ${walletsError.message}`);
            }
            return {
                user,
                wallets: wallets || []
            };
        }
        catch (error) {
            console.error('Error in getUserProfile:', error);
            throw error;
        }
    }
    /**
     * Update a wallet
     * @param walletId Wallet ID
     * @param updateData Data to update
     * @returns Updated wallet or null if failed
     */
    static async updateWallet(walletId, updateData) {
        try {
            const { data, error } = await supabase_1.supabase
                .from('wallets')
                .update(updateData)
                .eq('id', walletId)
                .select()
                .single();
            if (error) {
                console.error('Error updating wallet:', error);
                return null;
            }
            return data;
        }
        catch (error) {
            console.error('Error in updateWallet:', error);
            return null;
        }
    }
    /**
     * Update transaction by reference
     */
    static async updateTransactionByReference(reference, updateData) {
        try {
            const { data, error } = await supabase_1.supabase
                .from('transactions')
                .update(updateData)
                .eq('paymentReference', reference)
                .select()
                .single();
            if (error) {
                console.error('Error updating transaction by reference:', error);
                throw error;
            }
            return data;
        }
        catch (error) {
            console.error('Database error:', error);
            throw error;
        }
    }
}
exports.DatabaseService = DatabaseService;
DatabaseService.supabase = supabase_1.supabase;
