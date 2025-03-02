import { config } from '../../config/env';
import axios from 'axios';
import { ethers } from 'ethers';
import { blockCypherConfig, getBlockCypherUrl } from '../../config/blockcypher';
import { DatabaseService } from './databaseService';
import { Wallet } from '../types/database';
import { BlockchainService } from './blockchainService';

export class WalletService {
  static async getUserWallet(userId: string, walletAddress: string, walletPrivateKey: string): Promise<{ address: string; privateKey: string }> {
    // Simply return the provided wallet information
    return {
      address: walletAddress,
      privateKey: walletPrivateKey
    };
  }
  
  static checkUserBalance(balance: string, amount: string): boolean {
    // Check if user has enough balance for the transaction
    return parseFloat(balance) >= parseFloat(amount);
  }
  
  static getCompanyWallet() {
    return {
      address: config.blockchain.companyWallet.address,
      privateKey: config.blockchain.companyWallet.privateKey,
    };
  }

  /**
   * Generate a new Ethereum wallet
   * @returns Object containing address and private key
   */
  static async generateWallet(): Promise<{ address: string; privateKey: string }> {
    try {
      // First try to use BlockCypher API
      const response = await axios.post(
        'https://api.blockcypher.com/v1/eth/main/addrs', // Updated to use mainnet
        {},
        {
          params: {
            token: blockCypherConfig.token
          }
        }
      );

      if (response.data && response.data.address && response.data.private) {
        return {
          address: response.data.address,
          privateKey: response.data.private
        };
      }
      throw new Error('Invalid response from BlockCypher');
    } catch (error) {
      console.log('BlockCypher wallet generation failed, falling back to ethers:', error);
      
      // Fallback to ethers.js if BlockCypher fails
      const wallet = ethers.Wallet.createRandom();
      return {
        address: wallet.address,
        privateKey: wallet.privateKey
      };
    }
  }

  /**
   * Create a new wallet for a user
   * @param userId User ID
   * @param cryptoType Cryptocurrency type
   * @param label Optional label for the wallet
   * @returns Created wallet or null
   */
  static async createWalletForUser(
    userId: string,
    cryptoType: string,
    label?: string
  ): Promise<Wallet | null> {
    try {
      // Check if user exists
      const user = await DatabaseService.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Generate a new wallet using BlockCypher
      const { address, privateKey } = await this.generateWallet();
      
      // Check if this is the first wallet for this crypto type
      const userWallets = await DatabaseService.getUserWallets(userId);
      const isFirstOfType = !userWallets.some(w => w.crypto_type === cryptoType);
      
      // Create wallet in database
      const newWallet = await DatabaseService.createWallet({
        user_id: userId,
        address,
        crypto_type: cryptoType,
        is_primary: isFirstOfType,
        label: label || `${cryptoType} Wallet`,
        private_key: privateKey // Note: In production, encrypt this or use a different approach
      });
      
      return newWallet;
    } catch (error) {
      console.error('Error creating wallet for user:', error);
      return null;
    }
  }

  /**
   * Get wallet balance using BlockCypher
   * @param address Wallet address
   * @param cryptoType Cryptocurrency type
   * @returns Wallet balance as string
   */
  static async getWalletBalance(address: string, cryptoType: string): Promise<string> {
    try {
      if (cryptoType !== 'ETH' && cryptoType !== 'USDT') {
        throw new Error(`Unsupported cryptocurrency: ${cryptoType}`);
      }
      
      if (cryptoType === 'ETH') {
        try {
          // Try BlockCypher first
          const response = await axios.get(
            getBlockCypherUrl(`/addrs/${address}/balance`),
            {
              params: {
                token: blockCypherConfig.token
              }
            }
          );
          
          if (response.data && response.data.balance !== undefined) {
            // BlockCypher returns balance in wei (satoshis for ETH)
            const balanceInEth = ethers.formatEther(response.data.balance.toString());
            return balanceInEth;
          }
        } catch (blockCypherError) {
          console.error('BlockCypher balance check failed, falling back to provider:', blockCypherError);
        }
      }
      
      // Fallback to our existing blockchain service
      return await BlockchainService.getWalletBalance(address, cryptoType);
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      throw new Error(`Failed to get ${cryptoType} balance for ${address}`);
    }
  }

  /**
   * Get wallet transaction history using BlockCypher
   * @param address Wallet address
   * @param limit Number of transactions to return
   * @returns Array of transactions
   */
  static async getWalletTransactions(address: string, limit: number = 10): Promise<any[]> {
    try {
      const response = await axios.get(
        getBlockCypherUrl(`/addrs/${address}`),
        {
          params: {
            token: blockCypherConfig.token,
            limit,
            includeScript: false,
            includeConfidence: false
          }
        }
      );
      
      if (response.data && response.data.txrefs) {
        return response.data.txrefs.map((tx: any) => ({
          hash: tx.tx_hash,
          block_height: tx.block_height,
          confirmed: tx.confirmed,
          value: ethers.formatEther(tx.value.toString()),
          spent: tx.spent,
          confirmations: tx.confirmations
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error getting wallet transactions:', error);
      return [];
    }
  }

  /**
   * Verify a wallet address using BlockCypher
   * @param address Wallet address to verify
   * @returns Boolean indicating if address is valid
   */
  static async verifyAddress(address: string): Promise<boolean> {
    try {
      // First check using ethers.js
      if (!ethers.isAddress(address)) {
        return false;
      }
      
      // Then verify with BlockCypher
      try {
        const response = await axios.get(
          getBlockCypherUrl(`/addrs/${address}`),
          {
            params: {
              token: blockCypherConfig.token
            }
          }
        );
        
        return !!response.data && !!response.data.address;
      } catch (error) {
        // If BlockCypher returns a 404, the address doesn't exist but might be valid
        if (
          error && 
          typeof error === 'object' && 
          'response' in error && 
          error.response && 
          typeof error.response === 'object' && 
          'status' in error.response && 
          error.response.status === 404
        ) {
          return true; // Address format is valid but not found on blockchain
        }
        
        console.error('BlockCypher address verification failed:', error);
        // Fall back to ethers.js validation only
        return ethers.isAddress(address);
      }
    } catch (error) {
      console.error('Error verifying address:', error);
      return false;
    }
  }

  static async checkWalletExistence(address: string): Promise<boolean> {
    try {
      // First check using ethers.js
      if (!ethers.isAddress(address)) {
        return false;
      }
      
      // Then verify with BlockCypher
      try {
        const response = await axios.get(
          getBlockCypherUrl(`/addrs/${address}`),
          {
            params: {
              token: blockCypherConfig.token
            }
          }
        );
        
        return !!response.data && !!response.data.address;
      } catch (error) {
        console.error('Error checking wallet existence:', error);
        
        // Type guard to check if error is an object with response property
        if (
          error && 
          typeof error === 'object' && 
          'response' in error && 
          error.response && 
          typeof error.response === 'object' && 
          'status' in error.response && 
          error.response.status === 404
        ) {
          // Wallet doesn't exist, create it
          return false;
        }
        
        throw new Error(`Failed to check wallet existence: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error checking wallet existence:', error);
      throw new Error(`Failed to check wallet existence: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 