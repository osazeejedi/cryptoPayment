import { Request, Response } from 'express';
import { BalanceService } from '../services/balanceService';
import { BlockchainService } from '../services/blockchainService';

export class BalanceController {
  static async getBalance(req: Request, res: Response): Promise<void> {
    try {
      const { wallet_address, token_address } = req.query;
      
      // Validate request
      if (!wallet_address) {
        res.status(400).json({ status: 'error', message: 'Missing wallet_address parameter' });
        return;
      }
      
      // If token_address is provided, get token balance
      if (token_address) {
        const tokenBalance = await BlockchainService.getBalance(
          wallet_address.toString(),
          token_address.toString()
        );
        
        res.status(200).json({
          status: 'success',
          wallet_address: wallet_address.toString(),
          token_address: token_address.toString(),
          balance: tokenBalance,
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      // Otherwise get ETH balance
      const ethBalance = await BalanceService.getEthBalance(wallet_address.toString());
      
      res.status(200).json({
        status: 'success',
        wallet_address: wallet_address.toString(),
        balance: ethBalance,
        currency: 'ETH',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Balance fetch error:', error);
      res.status(500).json({ 
        status: 'error', 
        message: error instanceof Error ? error.message : 'An unknown error occurred' 
      });
    }
  }
} 