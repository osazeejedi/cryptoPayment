import { Request, Response } from 'express';
import { BlockchainService } from '../services/blockchainService';
import { BalanceService } from '../services/balanceService';

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
      
      // Validate request
      if (!from_private_key || !to_address || !amount || !crypto_type) {
        res.status(400).json({ 
          status: 'error', 
          message: 'Missing required parameters' 
        });
        return;
      }
      
      // Validate the private key format (basic check)
      if (!from_private_key.startsWith('0x') || from_private_key.length !== 66) {
        res.status(400).json({ 
          status: 'error', 
          message: 'Invalid private key format' 
        });
        return;
      }
      
      // Validate the recipient address
      if (!BlockchainService.isValidAddress(to_address, crypto_type)) {
        res.status(400).json({ 
          status: 'error', 
          message: `Invalid ${crypto_type} address: ${to_address}` 
        });
        return;
      }
      
      // Send the crypto
      const txHash = await BlockchainService.sendCrypto(
        from_private_key,
        to_address,
        amount,
        crypto_type
      );
      
      // Return the transaction details
      res.status(200).json({
        status: 'success',
        message: `Successfully sent ${amount} ${crypto_type} to ${to_address}`,
        data: {
          transaction_hash: txHash,
          from_address: BlockchainService.getAddressFromPrivateKey(from_private_key),
          to_address,
          amount,
          crypto_type,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error sending crypto:', error);
      res.status(500).json({ 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Failed to send cryptocurrency' 
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