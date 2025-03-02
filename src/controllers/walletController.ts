import { Request, Response } from 'express';
import { DatabaseService } from '../services/databaseService';
import { WalletService } from '../services/walletService';
import { BlockchainService } from '../services/blockchainService';

export class WalletController {
  /**
   * Get user wallet
   */
  static async getUserWallet(req: Request & { user?: { id: string } }, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'Unauthorized'
        });
        return;
      }
      
      // Get user's wallets
      let wallets = await DatabaseService.getUserWallets(userId);
      
      // If user has no wallet, create one
      if (wallets.length === 0) {
        // Create an ETH wallet for the user
        const walletData = await WalletService.generateWallet();
        
        if (!walletData) {
          res.status(500).json({
            status: 'error',
            message: 'Failed to generate wallet'
          });
          return;
        }
        
        const newWallet = await DatabaseService.createWallet({
          user_id: userId,
          address: walletData.address,
          label: 'Default ETH Wallet',
          crypto_type: 'ETH',
          is_primary: true
        });
        
        if (!newWallet) {
          res.status(500).json({
            status: 'error',
            message: 'Failed to create wallet'
          });
          return;
        }
        
        wallets = [newWallet];
      }
      
      // Return the first wallet (we're assuming one wallet per user for now)
      res.status(200).json({
        status: 'success',
        data: {
          eth_address: wallets[0].address,
          user_id: userId
        }
      });
    } catch (error) {
      console.error('Error getting user wallet:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to get wallet'
      });
    }
  }
  
  /**
   * Get wallet balance
   */
  static async getWalletBalance(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.params;
      
      if (!address) {
        res.status(400).json({
          status: 'error',
          message: 'Wallet address is required'
        });
        return;
      }
      
      // Get balance using the blockchain service
      const balance = await BlockchainService.getWalletBalance(address, 'ETH');
      
      res.status(200).json({
        status: 'success',
        data: {
          address,
          balance
        }
      });
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to get balance'
      });
    }
  }
} 