import { Request, Response } from 'express';
import { PriceService } from '../services/priceService';
import { BlockchainService } from '../services/blockchainService';
import { WalletService } from '../services/walletService';

export class SellController {
  static async sellRequest(req: Request, res: Response): Promise<void> {
    try {
      const { 
        user_id, 
        amount, 
        crypto_type, 
        wallet_address, 
        wallet_private_key,
        balance 
      } = req.body;
      
      // Validate request
      if (!user_id || !amount || !crypto_type || !wallet_address || !wallet_private_key || !balance) {
        res.status(400).json({ status: 'error', message: 'Missing required fields' });
        return;
      }
      
      // Check if user has sufficient balance
      const hasBalance = WalletService.checkUserBalance(balance, amount);
      if (!hasBalance) {
        res.status(400).json({ status: 'error', message: 'Insufficient funds in user wallet' });
        return;
      }
      
      // Convert crypto to Naira
      const nairaValue = await PriceService.convertCryptoToNaira(amount, crypto_type);
      
      // Process the sell request
      const txHash = await BlockchainService.processSellRequest(
        user_id, 
        amount, 
        crypto_type, 
        nairaValue,
        wallet_address,
        wallet_private_key
      );
      
      // Return response
      res.status(200).json({
        status: 'success',
        transaction_hash: txHash,
        crypto_type,
        amount,
        naira_value: nairaValue,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Sell request error:', error);
      res.status(500).json({ 
        status: 'error', 
        message: error instanceof Error ? error.message : 'An unknown error occurred' 
      });
    }
  }
} 