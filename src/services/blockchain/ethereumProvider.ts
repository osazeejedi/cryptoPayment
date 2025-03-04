import { ethers } from 'ethers';
import { IBlockchainProvider, IERC20Provider, IWalletProvider } from '../../interfaces/blockchain';
import { BlockchainError, handleServiceError } from '../../utils/serviceErrors';
import { config } from '../../../config/env';

interface IERC20Contract extends ethers.BaseContract {
  transfer(to: string, amount: bigint, overrides?: any): Promise<any>;
  balanceOf(owner: string): Promise<bigint>;
  decimals(): Promise<number>;
  symbol(): Promise<string>;
  approve(spender: string, amount: bigint): Promise<any>;
  
  estimateGas: {
    transfer(to: string, amount: bigint): Promise<bigint>;
  }
}

export class EthereumProvider implements IBlockchainProvider, IERC20Provider, IWalletProvider {
  private provider: ethers.JsonRpcProvider;
  private companyWallet: ethers.Wallet;
  
  constructor() {
    try {
      // Use Alchemy for provider
      const alchemyUrl = `https://eth-sepolia.g.alchemy.com/v2/${config.blockchain.alchemyApiKey}`;
      this.provider = new ethers.JsonRpcProvider(alchemyUrl);
      
      // Set up company wallet
      if (!config.blockchain.companyWallet.privateKey) {
        throw new BlockchainError('Company wallet private key is not configured');
      }
      
      this.companyWallet = new ethers.Wallet(
        config.blockchain.companyWallet.privateKey,
        this.provider
      );
      
      console.log('Ethereum provider initialized with company wallet:', 
        this.companyWallet.address.substring(0, 10) + '...');
    } catch (error) {
      throw handleServiceError(error, 'blockchain');
    }
  }
  
  async getBalance(address: string, cryptoType: string): Promise<string> {
    try {
      if (cryptoType === 'ETH') {
        const balance = await this.provider.getBalance(address);
        return ethers.formatEther(balance);
      } else {
        // For ERC20 tokens, get token contract and call balanceOf
        const tokenContract = await this.getTokenContract(cryptoType);
        const balance = await tokenContract.balanceOf(address);
        const decimals = await tokenContract.decimals();
        return ethers.formatUnits(balance, decimals);
      }
    } catch (error) {
      throw handleServiceError(error, 'blockchain');
    }
  }
  
  async transferCrypto(to: string, amount: string, cryptoType: string): Promise<string> {
    try {
      if (cryptoType === 'ETH') {
        // Transfer ETH
        const tx = await this.companyWallet.sendTransaction({
          to,
          value: ethers.parseEther(amount)
        });
        
        console.log(`ETH transfer initiated: ${tx.hash}`);
        const receipt = await tx.wait();
        return tx.hash;
      } else {
        // Transfer ERC20 token
        const tokenContract = await this.getTokenContract(cryptoType);
        const decimals = await tokenContract.decimals();
        const tokenAmount = ethers.parseUnits(amount, decimals);
        
        const tx = await tokenContract.transfer(to, tokenAmount);
        console.log(`${cryptoType} transfer initiated: ${tx.hash}`);
        const receipt = await tx.wait();
        return tx.hash;
      }
    } catch (error) {
      throw handleServiceError(error, 'blockchain');
    }
  }
  
  async verifyTransaction(txHash: string): Promise<boolean> {
    try {
      const tx = await this.provider.getTransaction(txHash);
      if (!tx) {
        return false;
      }
      
      // Check if transaction is confirmed
      const receipt = await this.provider.getTransactionReceipt(txHash);
      if (!receipt) {
        return false;
      }
      
      const currentBlock = await this.provider.getBlockNumber();
      const confirmations = currentBlock - receipt.blockNumber;
      
      // Consider confirmed after 3 confirmations
      return confirmations >= 3;
    } catch (error) {
      throw handleServiceError(error, 'blockchain');
    }
  }
  
  async estimateGas(to: string, amount: string, cryptoType: string): Promise<string> {
    try {
      if (cryptoType === 'ETH') {
        const gasEstimate = await this.provider.estimateGas({
          from: this.companyWallet.address,
          to,
          value: ethers.parseEther(amount)
        });
        return gasEstimate.toString();
      } else {
        const tokenContract = await this.getTokenContract(cryptoType);
        const decimals = await tokenContract.decimals();
        const tokenAmount = ethers.parseUnits(amount, decimals);
        
        const gasEstimate = await tokenContract.estimateGas.transfer(to, tokenAmount);
        return gasEstimate.toString();
      }
    } catch (error) {
      throw handleServiceError(error, 'blockchain');
    }
  }
  
  // IERC20Provider methods
  async getTokenBalance(tokenAddress: string, ownerAddress: string): Promise<string> {
    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'],
        this.provider
      );
      
      const balance = await tokenContract.balanceOf(ownerAddress);
      const decimals = await tokenContract.decimals();
      return ethers.formatUnits(balance, decimals);
    } catch (error) {
      throw handleServiceError(error, 'blockchain');
    }
  }
  
  async transfer(tokenAddress: string, to: string, amount: string): Promise<string> {
    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function transfer(address, uint256) returns (bool)', 'function decimals() view returns (uint8)'],
        this.companyWallet
      );
      
      const decimals = await tokenContract.decimals();
      const tokenAmount = ethers.parseUnits(amount, decimals);
      
      const tx = await tokenContract.transfer(to, tokenAmount);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      throw handleServiceError(error, 'blockchain');
    }
  }
  
  async approve(tokenAddress: string, spender: string, amount: string): Promise<string> {
    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function approve(address, uint256) returns (bool)', 'function decimals() view returns (uint8)'],
        this.companyWallet
      );
      
      const decimals = await tokenContract.decimals();
      const tokenAmount = ethers.parseUnits(amount, decimals);
      
      const tx = await tokenContract.approve(spender, tokenAmount);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      throw handleServiceError(error, 'blockchain');
    }
  }
  
  // IWalletProvider methods
  async createWallet(): Promise<{ address: string; privateKey: string }> {
    try {
      const wallet = ethers.Wallet.createRandom();
      return {
        address: wallet.address,
        privateKey: wallet.privateKey
      };
    } catch (error) {
      throw handleServiceError(error, 'blockchain');
    }
  }
  
  getAddressFromPrivateKey(privateKey: string): string {
    try {
      const wallet = new ethers.Wallet(privateKey);
      return wallet.address;
    } catch (error) {
      throw handleServiceError(error, 'blockchain');
    }
  }
  
  async signMessage(message: string, privateKey: string): Promise<string> {
    try {
      const wallet = new ethers.Wallet(privateKey);
      return await wallet.signMessage(message);
    } catch (error) {
      throw handleServiceError(error, 'blockchain');
    }
  }
  
  async verifySignature(message: string, signature: string, address: string): Promise<boolean> {
    try {
      const signerAddress = ethers.verifyMessage(message, signature);
      return signerAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
      throw handleServiceError(error, 'blockchain');
    }
  }
  
  // Helper methods
  private async getTokenContract(cryptoType: string) {
    let tokenAddress: string;
    
    // Get token address based on crypto type
    switch (cryptoType.toUpperCase()) {
      case 'USDT':
        tokenAddress = config.blockchain.tokens.usdt;
        break;
      case 'USDC':
        tokenAddress = config.blockchain.tokens.usdc;
        break;
      default:
        throw new BlockchainError(`Unsupported token type: ${cryptoType}`);
    }
    
    if (!tokenAddress) {
      throw new BlockchainError(`Token address not configured for ${cryptoType}`);
    }
    
    // Use a more complete ABI that includes all the methods we need
    const contract = new ethers.Contract(
      tokenAddress,
      [
        'function balanceOf(address) view returns (uint256)',
        'function transfer(address, uint256) returns (bool)',
        'function decimals() view returns (uint8)',
        'function symbol() view returns (string)',
        'function approve(address, uint256) returns (bool)'
      ],
      this.companyWallet
    );
    
    // Use a two-step casting approach
    return contract as unknown as IERC20Contract;
  }
} 