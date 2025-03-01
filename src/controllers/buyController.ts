import { Request, Response } from 'express';
import { BlockchainService } from '../services/blockchainService';
import { PriceService } from '../services/priceService';

export class BuyController {
  static async buyRequest(req: Request, res: Response): Promise<void> {
    try {
      const { user_id, amount, crypto_type, wallet_address } = req.body;
      
      // Validate request
      if (!user_id || !amount || !crypto_type || !wallet_address) {
        res.status(400).json({ status: 'error', message: 'Missing required fields' });
        return;
      }
      
      // Convert crypto to Naira
      const nairaValue = await PriceService.convertCryptoToNaira(amount, crypto_type);
      
      // Process the buy request
      const txHash = await BlockchainService.processBuyRequest(
        user_id, 
        amount, 
        crypto_type, 
        nairaValue,
        wallet_address
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
      console.error('Buy request error:', error);
      res.status(500).json({ 
        status: 'error', 
        message: error instanceof Error ? error.message : 'An unknown error occurred' 
      });
    }
  }
} 