import { web3 } from '../../config/blockchain';
import { BlockchainService } from './blockchainService';
import { ethers } from 'ethers';

export class BalanceService {
  /**
   * Get ETH balance for a wallet address
   * @param walletAddress The Ethereum wallet address
   * @returns The balance in ETH as a string
   */
  static async getEthBalance(walletAddress: string): Promise<string> {
    try {
      // Validate the wallet address
      if (!web3.utils.isAddress(walletAddress)) {
        throw new Error('Invalid Ethereum address');
      }
      
      // Get balance in Wei
      const balanceWei = await web3.eth.getBalance(walletAddress);
      
      // Convert Wei to ETH
      const balanceEth = web3.utils.fromWei(balanceWei, 'ether');
      
      return balanceEth;
    } catch (error) {
      console.error('Error fetching ETH balance:', error);
      throw new Error('Failed to fetch wallet balance');
    }
  }
  
  /**
   * Get ERC20 token balance for a wallet address
   * @param walletAddress The Ethereum wallet address
   * @param tokenContractAddress The token contract address
   * @returns The token balance as a string
   */
  static async getTokenBalance(walletAddress: string, tokenContractAddress: string): Promise<string> {
    try {
      // Validate addresses
      if (!web3.utils.isAddress(walletAddress) || !web3.utils.isAddress(tokenContractAddress)) {
        throw new Error('Invalid address provided');
      }
      
      // ERC20 balanceOf method ABI
      const minABI = [
        {
          constant: true,
          inputs: [{ name: "_owner", type: "address" }],
          name: "balanceOf",
          outputs: [{ name: "balance", type: "uint256" }],
          type: "function",
        },
        {
          constant: true,
          inputs: [],
          name: "decimals",
          outputs: [{ name: "", type: "uint8" }],
          type: "function",
        }
      ];
      
      // Create contract instance
      const contract = new web3.eth.Contract(minABI, tokenContractAddress);
      
      // Get token decimals
      const decimals = await contract.methods.decimals().call();
      
      // Get raw balance
      const balance = await contract.methods.balanceOf(walletAddress).call();
      
      // Format balance with proper decimals
      const formattedBalance = Number(balance) / Math.pow(10, Number(decimals));
      
      return formattedBalance.toString();
    } catch (error) {
      console.error('Error fetching token balance:', error);
      throw new Error('Failed to fetch token balance');
    }
  }
  
  /**
   * Check if a wallet has sufficient ETH balance
   * @param walletAddress The wallet address to check
   * @param requiredAmount The amount of ETH required
   * @returns Boolean indicating if the wallet has sufficient balance
   */
  static async hasSufficientEthBalance(walletAddress: string, requiredAmount: string): Promise<boolean> {
    try {
      const balance = await this.getEthBalance(walletAddress);
      return parseFloat(balance) >= parseFloat(requiredAmount);
    } catch (error) {
      console.error('Error checking ETH balance:', error);
      return false;
    }
  }

  /**
   * Get wallet balance for a specific cryptocurrency
   * @param address Wallet address
   * @param cryptoType Type of cryptocurrency
   * @returns Balance as a string
   */
  static async getWalletBalance(address: string, cryptoType: string): Promise<string> {
    try {
      // Validate the address
      if (!BlockchainService.isValidAddress(address, cryptoType)) {
        throw new Error(`Invalid ${cryptoType} address: ${address}`);
      }
      
      if (cryptoType === 'ETH') {
        // Get ETH balance
        const provider = BlockchainService.getProvider('ETH');
        const balance = await provider.getBalance(address);
        return ethers.formatEther(balance);
      } else if (cryptoType === 'USDT') {
        // Get USDT balance
        const tokenContract = BlockchainService.getTokenContract('USDT');
        const balance = await tokenContract.balanceOf(address);
        const decimals = await BlockchainService.getTokenDecimals('USDT');
        return ethers.formatUnits(balance, decimals);
      } else {
        throw new Error(`Unsupported cryptocurrency: ${cryptoType}`);
      }
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      throw new Error(`Failed to get ${cryptoType} balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 