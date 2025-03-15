import { Request, Response } from 'express';
import { DatabaseService } from '../services/databaseService';
import { WalletService } from '../services/walletService';
import { BlockchainService } from '../services/blockchainService';
import { supabase } from '../../config/supabase';
import { AuthenticatedRequest } from '../types/express';
import { handleError } from '../utils/errorHandler';
import { decrypt } from '../utils/helper';

export class WalletController {
  /**
   * Get user's wallet information
   */
  static async getUserWallet(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
  
      // Get wallets from database
      const { data: wallets, error } = await supabase
        .from('wallets')
        .select('address, crypto_type, created_at')
        .eq('user_id', userId);
  
      if (error || !wallets || wallets.length === 0) {
        res.status(404).json({
          status: 'error',
          message: 'No wallets found for this user',
        });
        return;
      }
  
      // Fetch balances for each wallet based on crypto_type
      const walletData = await Promise.all(
        wallets.map(async (wallet) => {
          let balances: { [key: string]: string } = {};
  
          if (wallet.crypto_type === 'TRX') {
            // Fetch TRX and TRC-20 token balances
            const usdtBalance = await BlockchainService.getTronsBalance(wallet.address, 'USDT');
            const wethBalance = await BlockchainService.getTronsBalance(wallet.address, 'WETH');
            balances = {
              USDT: usdtBalance,
              WETH: wethBalance,
            };
          } else {
            // Fetch ETH and BTC balances
            const ethBalance = await BlockchainService.getBalance(wallet.address, 'ETH');
            const btcBalance = await BlockchainService.getBalance(wallet.address, 'BTC');
            balances = {
              ETH: ethBalance,
              BTC: btcBalance,
            };
          }
  
          return {
            address: wallet.address,
            crypto_type: wallet.crypto_type,
            created_at: wallet.created_at,
            balances,
          };
        })
      );
  
      res.status(200).json({
        status: 'success',
        data: walletData,
      });
    } catch (error) {
      handleError(error, res, 'Failed to get user wallet');
    }
  }
  
  /**
   * Get wallet balance
   */
  static async getWalletBalance(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.params;
      const { crypto_type } = req.query;
      
      if (!address || !crypto_type) {
        res.status(400).json({
          status: 'error',
          message: 'Address and crypto type are required'
        });
        return;
      }
      
      // Get balance from blockchain
      const balance = await BlockchainService.getBalance(address, crypto_type as string);
      
      res.status(200).json({
        status: 'success',
        data: {
          address,
          crypto_type,
          balance
        }
      });
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to get wallet balance'
      });
    }
  }
  
  /**
   * Get user's wallet private key (SECURITY SENSITIVE)
   * This should be protected with additional authentication
   */
  static async getWalletPrivateKey(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
  
      // Additional security check - require password confirmation
      const { password, crypto_type } = req.body;
      if (!password || !crypto_type) {
        res.status(400).json({
          status: 'error',
          message: 'Password confirmation and crypto_type are required',
        });
        return;
      }
  
      // Verify password
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', userId)
        .single();
  
      if (userError || !user) {
        res.status(401).json({
          status: 'error',
          message: 'Authentication failed',
        });
        return;
      }
  
      // Verify password (implement your password verification logic)
      const isPasswordValid = await verifyPassword(password, user.password_hash);
      if (!isPasswordValid) {
        res.status(401).json({
          status: 'error',
          message: 'Invalid password',
        });
        return;
      }
  
      // Get wallets from database
      const { data: wallets, error } = await supabase
        .from('wallets')
        .select('private_key, crypto_type')
        .eq('user_id', userId);
  
      if (error || !wallets || wallets.length === 0) {
        res.status(404).json({
          status: 'error',
          message: 'No wallets found for this user',
        });
        return;
      }
  
      // Find the wallet with the matching crypto_type
      const wallet = wallets.find((w) => w.crypto_type === crypto_type);
  
      if (!wallet) {
        res.status(404).json({
          status: 'error',
          message: `No wallet found for crypto_type: ${crypto_type}`,
        });
        return;
      }
  
      res.status(200).json({
        status: 'success',
        data: {
          private_key: decrypt(wallet.private_key),
        },
      });
    } catch (error) {
      handleError(error, res, 'Failed to get wallet private key');
    }
  }
  
  /**
   * Get user's transaction history
   */
  static async getUserTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10, type } = req.query;
      
      // Calculate offset for pagination
      const offset = (Number(page) - 1) * Number(limit);
      
      // Build query
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + Number(limit) - 1);
      
      // Add filter by transaction type if provided
      if (type) {
        query = query.eq('transaction_type', type);
      }
      
      // Execute query
      const { data: transactions, error, count } = await query;
      
      if (error) {
        res.status(500).json({
          status: 'error',
          message: 'Failed to fetch transactions'
        });
        return;
      }
      
      // Get total count for pagination
      const { count: totalCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      res.status(200).json({
        status: 'success',
        data: {
          transactions,
          pagination: {
            total: totalCount || 0,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil((totalCount || 0) / Number(limit))
          }
        }
      });
    } catch (error) {
      handleError(error, res, 'Failed to get user transactions');
    }
  }

  /**
   * Create a new wallet for the user
   */
  static async createWallet(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      const { crypto_type } = req.body;
      
      if (!crypto_type) {
        res.status(400).json({
          status: 'error',
          message: 'Crypto type is required'
        });
        return;
      }
      
      // Create wallet using blockchain service
      const walletData = await BlockchainService.createWallet(crypto_type);
      return;
      // // Save wallet to database
      // const wallet = await DatabaseService.createWallet({
      //   user_id: userId,
      //   address: walletData.address,
      //   crypto_type,
      //   private_key: walletData.privateKey, // Note: In a real app, encrypt this!
      //   is_primary: false // Add this line to fix the error
      // });
      
      // // If this is the user's first wallet, make it primary
      // if (wallet) {
      //   // Check if user has any other wallets
      //   const userWallets = await DatabaseService.getUserWallets(userId);
        
        // if (userWallets.length === 1) {
        //   // This is the first wallet, make it primary
        //   await DatabaseService.updateWallet(wallet.id, { is_primary: true });
        //   wallet.is_primary = true;
        // }
        
      //   res.status(201).json({
      //     status: 'success',
      //     data: {
      //       id: wallet.id,
      //       address: wallet.address,
      //       crypto_type: wallet.crypto_type
      //     }
      //   });
      // } else {
      //   throw new Error('Failed to create wallet');
      // }
    } catch (error) {
      console.error('Error creating wallet:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to create wallet'
      });
    }
  }
}

// Helper function to verify password
async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  // Implement your password verification logic here
  // This is a placeholder - you should use a proper password hashing library
  return true; // Replace with actual verification
} 