import { web3 } from '../../config/blockchain';
import { WalletService } from './walletService';

export class BlockchainService {
  static async transferCrypto(
    fromAddress: string,
    fromPrivateKey: string,
    toAddress: string,
    amount: string,
    cryptoType: string
  ): Promise<string> {
    try {
      // Convert amount to Wei (for ETH)
      const amountInWei = web3.utils.toWei(amount, 'ether');
      
      // Get the nonce for the from address
      const nonce = await web3.eth.getTransactionCount(fromAddress, 'latest');
      
      // Get current gas price and increase it for faster transactions
      const currentGasPrice = await web3.eth.getGasPrice();
      // Increase gas price by 20% for faster processing
      const fastGasPrice = Math.floor(Number(currentGasPrice) * 1.2).toString();
      
      // Create transaction object
      const txObject = {
        from: fromAddress,
        to: toAddress,
        value: amountInWei,
        // Standard gas limit for ETH transfers is 21000
        // For token transfers or more complex operations, this would be higher
        gas: 21000,
        // Use faster gas price
        gasPrice: fastGasPrice,
        nonce: nonce
      };
      
      // Sign the transaction
      const signedTx = await web3.eth.accounts.signTransaction(txObject, fromPrivateKey);
      
      if (!signedTx.rawTransaction) {
        throw new Error('Failed to sign transaction');
      }
      
      // Send the transaction
      const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
      
      // Return the transaction hash as a string
      return receipt.transactionHash.toString();
    } catch (error) {
      console.error('Error transferring crypto:', error);
      throw new Error('Failed to transfer cryptocurrency');
    }
  }
  
  static async processBuyRequest(
    userId: string, 
    amount: string, 
    cryptoType: string, 
    nairaValue: string,
    userWalletAddress: string
  ): Promise<string> {
    // Get company wallet
    const companyWallet = WalletService.getCompanyWallet();
    
    // Transfer crypto from company wallet to user wallet
    const txHash = await this.transferCrypto(
      companyWallet.address,
      companyWallet.privateKey,
      userWalletAddress,
      amount,
      cryptoType
    );
    
    return txHash;
  }
  
  static async processSellRequest(
    userId: string, 
    amount: string, 
    cryptoType: string, 
    nairaValue: string,
    userWalletAddress: string,
    userWalletPrivateKey: string
  ): Promise<string> {
    // Get company wallet
    const companyWallet = WalletService.getCompanyWallet();
    
    // Transfer crypto from user wallet to company wallet
    const txHash = await this.transferCrypto(
      userWalletAddress,
      userWalletPrivateKey,
      companyWallet.address,
      amount,
      cryptoType
    );
    
    return txHash;
  }
} 