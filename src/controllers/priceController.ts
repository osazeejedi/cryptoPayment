import { Request, Response } from 'express';
import { PriceService } from '../services/priceService';

export class PriceController {
  static async getPrice(req: Request, res: Response): Promise<void> {
    try {
      const { crypto_type, amount } = req.query;
      
      // Validate request
      if (!crypto_type) {
        res.status(400).json({ status: 'error', message: 'Missing crypto_type parameter' });
        return;
      }
      
      // If amount is provided, convert to Naira
      if (amount) {
        const nairaValue = await PriceService.convertCryptoToNaira(
          amount.toString(), 
          crypto_type.toString()
        );
        
        res.status(200).json({
          status: 'success',
          crypto_type: crypto_type.toString().toUpperCase(),
          amount: amount.toString(),
          naira_value: nairaValue,
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      // Otherwise just get the current price per unit
      const nairaValue = await PriceService.convertCryptoToNaira('1', crypto_type.toString());
      
      res.status(200).json({
        status: 'success',
        crypto_type: crypto_type.toString().toUpperCase(),
        price_per_unit: nairaValue,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Price fetch error:', error);
      res.status(500).json({ 
        status: 'error', 
        message: error instanceof Error ? error.message : 'An unknown error occurred' 
      });
    }
  }
} 