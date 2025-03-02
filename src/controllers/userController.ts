import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { DatabaseService } from '../services/databaseService';
import { WalletService } from '../services/walletService';

export class UserController {
  /**
   * Get user profile
   */
  static async getUserProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;
      
      // Verify user ID matches authenticated user
      if (req.user?.id !== userId) {
        res.status(403).json({
          status: 'error',
          message: 'Unauthorized access to user profile'
        });
        return;
      }
      
      const profile = await UserService.getUserProfile(userId);
      
      res.status(200).json({
        status: 'success',
        data: profile
      });
    } catch (error) {
      console.error('Error getting user profile:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to get user profile'
      });
    }
  }
  
  /**
   * Create a new wallet for a user
   */
  static async createWallet(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;
      const { crypto_type, label } = req.body;
      
      // Verify user ID matches authenticated user
      if (req.user?.id !== userId) {
        res.status(403).json({
          status: 'error',
          message: 'Unauthorized access'
        });
        return;
      }
      
      if (!crypto_type) {
        res.status(400).json({
          status: 'error',
          message: 'Cryptocurrency type is required'
        });
        return;
      }
      
      const wallet = await UserService.createWalletForUser(
        userId,
        crypto_type,
        label
      );
      
      if (!wallet) {
        res.status(500).json({
          status: 'error',
          message: 'Failed to create wallet'
        });
        return;
      }
      
      res.status(201).json({
        status: 'success',
        message: 'Wallet created successfully',
        data: {
          ...wallet,
          private_key: undefined // Don't expose private key
        }
      });
    } catch (error) {
      console.error('Error creating wallet:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to create wallet'
      });
    }
  }
  
  /**
   * Get user transactions
   */
  static async getUserTransactions(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      
      // Verify user ID matches authenticated user
      if (req.user?.id !== userId) {
        res.status(403).json({
          status: 'error',
          message: 'Unauthorized access to user transactions'
        });
        return;
      }
      
      const transactions = await DatabaseService.getUserTransactions(userId, limit, offset);
      
      res.status(200).json({
        status: 'success',
        data: transactions
      });
    } catch (error) {
      console.error('Error getting user transactions:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to get user transactions'
      });
    }
  }
  
  /**
   * Get wallet transactions
   */
  static async getWalletTransactions(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;
      const walletAddress = req.params.walletAddress;
      const limit = parseInt(req.query.limit as string) || 10;
      
      // Verify user ID matches authenticated user
      if (req.user?.id !== userId) {
        res.status(403).json({
          status: 'error',
          message: 'Unauthorized access to wallet transactions'
        });
        return;
      }
      
      // Verify wallet belongs to user
      const wallet = await DatabaseService.getWalletByAddress(walletAddress);
      if (!wallet || wallet.user_id !== userId) {
        res.status(403).json({
          status: 'error',
          message: 'Unauthorized access to wallet'
        });
        return;
      }
      
      const transactions = await WalletService.getWalletTransactions(walletAddress, limit);
      
      res.status(200).json({
        status: 'success',
        data: transactions
      });
    } catch (error) {
      console.error('Error getting wallet transactions:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to get wallet transactions'
      });
    }
  }
  
  /**
   * Register a new user with wallet
   */
  static async registerUser(req: Request, res: Response): Promise<void> {
    try {
      const { id, email, full_name, phone_number } = req.body;
      
      if (!id || !email) {
        res.status(400).json({
          status: 'error',
          message: 'User ID and email are required'
        });
        return;
      }
      
      const result = await UserService.createUserWithWallet({
        id,
        email,
        full_name,
        phone_number
      });
      
      res.status(201).json({
        status: 'success',
        message: 'User registered successfully with default wallets',
        data: result
      });
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to register user'
      });
    }
  }
} 