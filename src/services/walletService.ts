import { config } from '../../config/env';

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
} 