import { Request, Response } from 'express';
import { KorapayService } from '../services/korapayService';
import { BlockchainService } from '../services/blockchainService';
import { PriceService } from '../services/priceService';
import { DatabaseService } from '../services/databaseService';
import { config } from '../../config/env';
import { handleError } from '../utils/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import { ParsedQs } from 'qs';

export class SellController {

  /**
   * Verify a bank account
   */
  static async verifyBankAccount(req: Request, res: Response): Promise<void> {
    try {
      const { account_number, bank_code } = req.body;
      
      // Validate request
      if (!account_number || !bank_code) {
        res.status(400).json({
          status: 'error',
          message: 'Account number and bank code are required'
        });
        return;
      }
      
      // Verify account with Korapay
      const accountDetails = await KorapayService.verifyBankAccount(account_number, bank_code);
      
      // Return account details
      res.status(200).json({
        status: 'success',
        data: accountDetails
      });
    } catch (error) {
      console.error('Error verifying bank account:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to verify bank account'
      });
    }
  }
  
  /**
   * Get list of supported banks
   */
  static async getBanks(req: Request, res: Response): Promise<void> {
    try {
      // Get banks
      const banks = await KorapayService.getBanks();
      
      res.status(200).json({
        status: 'success',
        data: banks
      });
    } catch (error) {
      console.error('Error getting banks:', error);
      res.status(500).json({ 
        status: 'error', 
        message: 'Failed to get banks' 
      });
    }
  }
  
  /**
   * Process a sell request with bank payout
   */
  static async processBankPayout(req: Request, res: Response): Promise<void> {
    try {
      // Extract request data
      const {
        crypto_amount,
        crypto_type,
        bank_code,
        account_number,
        account_name,
        user_wallet_address,
        user_private_key,
        email,
        bank_name,
        first_name,
        last_name,
        address_information
      } = req.body;

      // Validate required fields
      if (!crypto_amount || !crypto_type || !bank_code || !account_number || 
          !account_name || !user_wallet_address || !user_private_key) {
         res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
        return;
      }

      // Validate wallet address
      if (!BlockchainService.isValidAddress(user_wallet_address, crypto_type)) {
         res.status(400).json({
          success: false,
          message: 'Invalid wallet address'
        });
        return;
      }

      // Convert crypto to Naira
      const nairaAmount = await PriceService.convertCryptoToNaira(crypto_amount, crypto_type);
      
      // Generate a unique reference for this transaction
      const reference = `SELL-${uuidv4()}`;
      
      console.log(`Processing sell request: ${crypto_amount} ${crypto_type} for ₦${nairaAmount}`);
      
      // First, transfer crypto from user wallet to company wallet
      try {
        console.log(`Initiating crypto transfer from ${user_wallet_address} to company wallet...`);
        
        const txHash = await BlockchainService.sendCrypto(
          user_private_key,
          config.blockchain.companyWallet.address,
          crypto_amount,
          crypto_type
        );
        
        console.log(`Crypto transfer successful. Transaction hash: ${txHash}`);
        
        // Now process the bank payout
        const payoutData = {
          amount: nairaAmount,
          bank_code,
          account_number,
          account_name,
          narration: `Crypto sell: ${crypto_amount} ${crypto_type}`,
          reference,
          email: email || 'customer@example.com',
          bank_name,
          first_name,
          last_name,
          address_information
        };
        
        console.log('Initiating bank payout:', payoutData);
        
        const payoutResult = await KorapayService.processBankPayout(payoutData);
        
        console.log('Bank payout result:', payoutResult);
        
        // Return success response
         res.status(200).json({
          success: true,
          message: 'Sell request processed successfully',
          data: {
            transaction_id: reference,
            crypto_amount,
            crypto_type,
            naira_amount: nairaAmount,
            blockchain_tx_hash: txHash,
            payout_status: payoutResult.status,
            payout_reference: payoutResult.reference || reference,
            bank_details: {
              bank_code,
              account_number,
              account_name
            }
          }
        });
        return;
        
      } catch (error) {
        console.error('Error transferring crypto:', error);
         res.status(500).json({
          success: false,
          message: 'Failed to transfer cryptocurrency',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        return
      }
      
    } catch (error) {
      console.error('Error processing sell request:', error);
       res.status(500).json({
        success: false,
        message: 'Failed to process sell request',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return
    }
  }
  
  /**
   * Check the status of a sell transaction
   */
  static async verifySellTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { transaction_id } = req.params;
      
      if (!transaction_id) {
        res.status(400).json({
          status: 'error',
          message: 'Transaction ID is required'
        });
        return;
      }
      
      // Get transaction from database
      const transaction = await DatabaseService.getTransaction(transaction_id);
      
      if (!transaction) {
        res.status(404).json({
          status: 'error',
          message: 'Transaction not found'
        });
        return;
      }
      
      // If transaction has a payment reference, verify with Korapay
      const paymentReference = transaction.paymentReference || null;
      
      if (paymentReference) {
        const payoutStatus = await KorapayService.checkPayoutStatus(paymentReference);
        
        res.status(200).json({
          status: 'success',
          data: {
            transaction_id: transaction.id,
            blockchain_tx_hash: transaction.blockchainTxHash,
            payout_reference: paymentReference,
            payout_status: payoutStatus.status,
            transaction_status: transaction.status,
            amount: transaction.amount,
            crypto_type: transaction.cryptoType,
            created_at: transaction.createdAt
          }
        });
      } else {
        res.status(200).json({
          status: 'success',
          data: {
            transaction_id: transaction.id,
            blockchain_tx_hash: transaction.blockchainTxHash,
            transaction_status: transaction.status,
            amount: transaction.amount,
            crypto_type: transaction.cryptoType,
            created_at: transaction.createdAt
          }
        });
      }
    } catch (error) {
      console.error('Error verifying sell transaction:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to verify sell transaction'
      });
    }
  }
} 