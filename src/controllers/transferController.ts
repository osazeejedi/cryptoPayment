import { Request, Response } from 'express';
import { BlockchainService } from '../services/blockchainService';
import { BalanceService } from '../services/balanceService';
import { PriceService } from '../services/priceService';

export class TransferController {
  /**
   * Send cryptocurrency to a specified address
   */
  static async sendCrypto(req: Request, res: Response): Promise<void> {

   
    try {
      console.log("Received crypto transfer request:", JSON.stringify(req.body, null, 2));
      
      const { 
        from_private_key, 
        to_address, 
        amount, 
        crypto_type 
      } = req.body;
      const cryptoAmount = await PriceService.convertNairaToCrypto(amount, crypto_type);
      // Validate request
      if (!from_private_key || !to_address || !amount || !crypto_type) {
        res.status(400).json({ 
          status: 'error', 
          message: 'Missing required fields' 
        });
        return;
      }
      
      // Validate address
      if (!BlockchainService.isValidAddress(to_address, crypto_type)) {
        res.status(400).json({ 
          status: 'error', 
          message: 'Invalid destination address' 
        });
        return;
      }
      
      // Send crypto
      const txHash = await BlockchainService.sendCrypto(
        from_private_key,
        to_address,
        cryptoAmount,
        crypto_type
      );
      
      res.status(200).json({
        status: 'success',
        data: {
          transaction_hash: txHash,
          from_address: BlockchainService.getAddressFromPrivateKey(from_private_key),
          to_address,
          cryptoAmount,
          crypto_type,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error sending crypto:', error);
      res.status(500).json({ 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Failed to send crypto' 
      });
    }
  }
  
  /**
   * Get transfer fee estimate
   */
  static async getTransferFee(req: Request, res: Response): Promise<void> {
    try {
      const { crypto_type } = req.query;
      
      if (!crypto_type) {
        res.status(400).json({
          status: 'error',
          message: 'Crypto type is required'
        });
        return;
      }
      
      // For testing, we'll just return a fixed fee
      // In a real implementation, we would call the blockchain service
      const fee = '0.0001'; // Mock fee for testing
      
      res.status(200).json({
        status: 'success',
        data: {
          fee,
          crypto_type,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error getting transfer fee:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to get transfer fee'
      });
    }
  }
  
  /**
   * Get the balance of a wallet
   */
  static async getBalance(req: Request, res: Response): Promise<void> {
    try {
      const { address, crypto_type } = req.query;
      
      if (!address || !crypto_type) {
        res.status(400).json({ 
          status: 'error', 
          message: 'Address and crypto type are required' 
        });
        return;
      }
      
      // Validate the address
      if (!BlockchainService.isValidAddress(address as string, crypto_type as string)) {
        res.status(400).json({ 
          status: 'error', 
          message: `Invalid ${crypto_type} address: ${address}` 
        });
        return;
      }
      
      // Get the balance
      const balance = await BalanceService.getWalletBalance(
        address as string, 
        crypto_type as string
      );
      
      res.status(200).json({
        status: 'success',
        data: {
          address,
          crypto_type,
          balance,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error getting balance:', error);
      res.status(500).json({ 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Failed to get wallet balance' 
      });
    }
  }
} 