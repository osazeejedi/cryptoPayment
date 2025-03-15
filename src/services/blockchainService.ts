import { web3 } from '../../config/blockchain';
import { WalletService } from './walletService';
import { ethers } from 'ethers';
import { config } from '../../config/env';
import { BlockchainFactory } from './blockchain/blockchainFactory';
import { IBlockchainProvider } from '../interfaces/blockchain';
import { withCircuitBreaker } from '../utils/circuitBreakerDecorator';
import { handleServiceError } from '../utils/serviceErrors';
import axios from 'axios';
import TronWeb from 'tronweb';

// Add this interface near the top of the file
interface IERC20Contract extends ethers.BaseContract {
  transfer(to: string, amount: bigint, overrides?: any): Promise<any>;
  balanceOf(owner: string): Promise<bigint>;
  decimals(): Promise<number>;
  symbol(): Promise<string>;
  approve(spender: string, amount: bigint): Promise<any>;
  
  // Remove the nested transfer property and use function overloading
  estimateGas: {
    transfer(to: string, amount: bigint): Promise<bigint>;
  }
}

// Add this interface near the top of the file
interface IUniswapRouterContract extends ethers.BaseContract {
  swapExactETHForTokens(
    amountOutMin: bigint, 
    path: string[], 
    to: string, 
    deadline: number, 
    overrides?: any
  ): Promise<any>;
  swapExactTokensForETH(
    amountIn: bigint, 
    amountOutMin: bigint, 
    path: string[], 
    to: string, 
    deadline: number, 
    overrides?: any
  ): Promise<any>;
  getAmountsOut(amountIn: bigint, path: string[]): Promise<bigint[]>;
}
export class BlockchainService {
  private static provider: ethers.Provider = new ethers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/_9Cg-dFoye2kHGgkOHajuOWCVGiO0_m1');
  
  private static ethProvider = new ethers.JsonRpcProvider(
    `https://eth-sepolia.g.alchemy.com/v2/${config.blockchain.alchemyApiKey}`
  );
  
  private static tronWeb = (() => {
    const tronWeb = new (TronWeb as any)({
      fullHost: 'https://api.trongrid.io',
      privateKey: config.blockchain.tronPrivateKey
    });
    return tronWeb;
  })();
  /**
   * Get balance of a wallet address
   */
  static async getBalance(address: string, cryptoType: string = 'ETH'): Promise<string> {
    try {
      // For ETH balance
      if (cryptoType === 'ETH') {
        const balance = await this.provider.getBalance(address);
        return ethers.formatEther(balance);
      }
      
      // For BTC (mock implementation since we're not connecting to Bitcoin network)
      if (cryptoType === 'BTC') {
        return '0.00000000'; // Placeholder BTC balance
      }
      
      // For ERC20 tokens
      const tokenAddresses: {[key: string]: string} = {
        'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7', // Mainnet USDT
        'USDC': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'  // Mainnet USDC
      };
      
      if (tokenAddresses[cryptoType]) {
        // ERC20 token ABI (minimal for balance checking)
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
        
        const tokenContract = new ethers.Contract(
          tokenAddresses[cryptoType],
          minABI,
          this.provider
        );
        
        const balance = await tokenContract.balanceOf(address);
        const decimals = await tokenContract.decimals();
        
        return ethers.formatUnits(balance, decimals);
      }
      
      throw new Error(`Unsupported cryptocurrency type: ${cryptoType}`);
    } catch (error: unknown) {
      console.error('[blockchain] Error:', error);
      throw new Error(`BlockchainError: Blockchain operation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  static async verifyTransaction(txHash: string, cryptoType: string): Promise<boolean> {
    try {
      console.log(`Verifying ${cryptoType} transaction: ${txHash}`);
      
      const ethersProvider = this.getEthersProvider(cryptoType);
      
      // Get transaction receipt
      const receipt = await ethersProvider.getTransactionReceipt(txHash);
      
      // If receipt exists and has confirmations, transaction is confirmed
      if (receipt && receipt.blockNumber) {
        const currentBlock = await ethersProvider.getBlockNumber();
        const confirmations = currentBlock - receipt.blockNumber;
        
        console.log(`Transaction ${txHash} has ${confirmations} confirmations`);
        
        // Consider confirmed after 3 confirmations
        return confirmations >= 3;
      }
      
      return false;
    } catch (error) {
      console.error(`Error verifying transaction ${txHash}:`, error);
      return false;
    }
  }
  
  static async estimateGas(to: string, amount: string, cryptoType: string = 'ETH'): Promise<string> {
    try {
      // Use getEthersProvider instead of this.provider
      const ethersProvider = this.getEthersProvider(cryptoType);
      
      if (cryptoType === 'ETH') {
        const gasEstimate = await ethersProvider.estimateGas({
          to,
          value: ethers.parseEther(amount)
        });
        return gasEstimate.toString();
      } else {
        // For token transfers
        const tokenContract = this.getTokenContract(cryptoType);
        const decimals = await tokenContract.decimals();
        const tokenAmount = ethers.parseUnits(amount, decimals);
        
        // Use the connected contract for estimation
        const gasEstimate = await tokenContract.estimateGas.transfer(to, tokenAmount);
        return gasEstimate.toString();
      }
    } catch (error) {
      console.error(`Error estimating gas for ${cryptoType} transfer:`, error);
      throw new Error(`Failed to estimate gas: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Add static properties
  private static readonly COMPANY_WALLET_PRIVATE_KEY = config.blockchain.companyWallet.privateKey;
  private static readonly COMPANY_WALLET_ADDRESS = config.blockchain.companyWallet.address;
  //private static readonly COMPANY_WALLET_PRIVATE_KEY = config.blockchain.companyWallet.privateKey;
  
  // Add USDT contract information
  private static readonly USDT_CONTRACT_ADDRESS = {
    mainnet: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    sepolia: '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06' // This is a test USDT on Sepolia
  };

  // ERC-20 ABI for token transfers
  private static readonly ERC20_ABI = [
    // Transfer function
    'function transfer(address to, uint256 amount) returns (bool)',
    // Balance function
    'function balanceOf(address owner) view returns (uint256)',
    // Decimals function
    'function decimals() view returns (uint8)',
    // Symbol function
    'function symbol() view returns (string)'
  ];
  
  // Add these constants for swap functionality
  private static readonly UNISWAP_ROUTER_ADDRESS = {
    mainnet: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    sepolia: '0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008' // Uniswap V2 Router on Sepolia
  };

  private static readonly WETH_ADDRESS = {
    mainnet: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    sepolia: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14' // Wrapped ETH on Sepolia
  };

  // Uniswap Router ABI (simplified for swapping)
  private static readonly UNISWAP_ROUTER_ABI = [
    'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
    'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
    'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)'
  ];
  
  // Provider method - renamed to avoid confusion
  static getEthersProvider(cryptoType: string): ethers.JsonRpcProvider {
    try {
      // For testing, use Sepolia testnet
      const network = 'Mainnet';
      
      // Use Alchemy for testnet
      const alchemyUrl = `https://eth-mainnet.g.alchemy.com/v2/_9Cg-dFoye2kHGgkOHajuOWCVGiO0_m1`;
      
      console.log(`Using ${network} testnet with Alchemy`);
      
      const provider = new ethers.JsonRpcProvider(alchemyUrl);
      
      // Set a reasonable timeout
      provider.pollingInterval = 5000; // 5 seconds
      
      return provider;
    } catch (error) {
      console.error('Error creating provider:', error);
      throw new Error('Failed to create blockchain provider');
    }
  }
  
  /**
   * Check if an address is valid for the specified cryptocurrency
   * @param address Address to validate
   * @param cryptoType Type of cryptocurrency (ETH, BTC)
   * @returns Whether the address is valid
   */
  static async isValidAddress(address: string, cryptoType: string): Promise<boolean> {
    try {
      switch (cryptoType.toUpperCase()) {
        case 'ETH':
          return await WalletService.verifyAddress(address);;
        case 'BTC':
          // Basic Bitcoin address validation (this is a simplified check)
          const btcRegex = config.blockchain.network === 'mainnet'
            ? /^(1|3|bc1)[a-zA-Z0-9]{25,62}$/
            : /^(m|n|2|tb1)[a-zA-Z0-9]{25,62}$/;
          return btcRegex.test(address);
        case 'TRX':
        case 'USDT_TRC20':
          // Validate Tron address
          return this.tronWeb.isAddress(address);
        default:
          console.warn(`Validation not implemented for ${cryptoType}`);
          return true; // Return true for unsupported types to avoid blocking
      }
    } catch (error) {
      console.error(`Error validating ${cryptoType} address:`, error);
      return false;
    }
  }

  /**
   * Transfer cryptocurrency to a specified address
   * @param toAddress Destination address
   * @param amount Amount of cryptocurrency
   * @param cryptoType Type of cryptocurrency (ETH, BTC)
   * @returns Transaction hash
   */
  static async transferCrypto(
    toAddress: string,
    amount: string,
    cryptoType: string
  ): Promise<string> {
    console.log(`Transferring ${amount} ${cryptoType} to ${toAddress}`);
    
    switch (cryptoType.toUpperCase()) {
      case 'ETH':
        return this.transferEther(toAddress, amount,"ETH");
      case 'USDT':
        return this.transferEther(toAddress, amount,"USDT");
      case 'BTC':
        const btcResult = await this.sendBitcoin(toAddress, amount);
        return btcResult.txHash;
      case 'TRX':
        return this.transferTrx(toAddress, amount);
      case 'USDT_TRC20':
        return this.transferUsdtTrc20(toAddress, amount);
      default:
        throw new Error(`Unsupported crypto type: ${cryptoType}`);
    }
  }
  
  /**
   * Transfer ETH to user wallet
   */
  private static async transferEth(toAddress: string, amount: string): Promise<string> {
    try {
      const wallet = new ethers.Wallet(config.blockchain.companyWalletPrivateKey, this.ethProvider);
      const tx = await wallet.sendTransaction({
        to: toAddress,
        value: ethers.parseEther(amount)
      });
      
      console.log(`ETH transfer initiated: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`ETH transfer confirmed: ${receipt?.hash}`);
      
      return receipt?.hash || tx.hash;
    } catch (error) {
      console.error('Error transferring ETH:', error);
      throw new Error('Failed to transfer ETH');
    }
  }
  
  /**
   * Transfer BTC to user wallet (placeholder)
   */
  private static async transferBtc(toAddress: string, amount: string): Promise<string> {
    // Existing BTC transfer code
    console.log(`Transferring ${amount} BTC to ${toAddress}`);
    return `btc-tx-${Date.now()}`;
  }
  
  /**
   * Transfer TRX (Tron) to user wallet
   */
  private static async transferTrx(toAddress: string, amount: string): Promise<string> {
    try {
      // Ensure TronWeb is properly initialized
      if (!this.tronWeb.defaultAddress.base58) {
        this.tronWeb.setPrivateKey(config.blockchain.tronPrivateKey);
      }
      
      // Convert amount to sun (1 TRX = 1,000,000 sun)
      const amountInSun = this.tronWeb.toSun(amount);
      
      // Create and sign the transaction
      const transaction = await this.tronWeb.transactionBuilder.sendTrx(
        toAddress,
        amountInSun,
        this.tronWeb.defaultAddress.base58
      );
      
      const signedTx = await this.tronWeb.trx.sign(transaction);
      const result = await this.tronWeb.trx.sendRawTransaction(signedTx);
      
      console.log('TRX transfer result:', result);
      
      if (result.result) {
        return result.txid;
      } else {
        throw new Error(`TRX transfer failed: ${JSON.stringify(result)}`);
      }
    } catch (error) {
      console.error('Error transferring TRX:', error);
      throw new Error(`Failed to transfer TRX: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Transfer USDT (TRC20) on Tron network
   */
  private static async transferUsdtTrc20(toAddress: string, amount: string): Promise<string> {
    try {
      // Ensure TronWeb is properly initialized
      if (!this.tronWeb.defaultAddress.base58) {
        this.tronWeb.setPrivateKey(config.blockchain.tronPrivateKey);
      }
      
      // USDT TRC20 contract address
      const contractAddress = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'; // USDT TRC20 contract on mainnet
      
      // Get contract instance
      const contract = await this.tronWeb.contract().at(contractAddress);
      
      // Convert amount to token decimals (USDT has 6 decimals)
      const amountInDecimals = Math.floor(parseFloat(amount) * 1000000).toString();
      
      // Send tokens
      const result = await contract.transfer(
        toAddress,
        amountInDecimals
      ).send({
        feeLimit: 100000000 // 100 TRX
      });
      
      console.log('USDT TRC20 transfer result:', result);
      return result;
    } catch (error) {
      console.error('Error transferring USDT TRC20:', error);
      throw new Error(`Failed to transfer USDT TRC20: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  static async processBuyRequest(
    userId: string, 
    amount: string, 
    cryptoType: string, 
    nairaValue: string,
    userWalletAddress: string
  ): Promise<string> {
    // Transfer crypto from company wallet to user wallet
    const txHash = await this.transferCrypto(
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
    const txHash = await this.sendCrypto(
      userWalletPrivateKey,
      companyWallet.address,
      amount,
      cryptoType
    );
    
    return txHash;
  }
  
  /**
   * Send cryptocurrency to a specified address
   * @param fromPrivateKey Private key of the sender's wallet
   * @param toAddress Recipient's wallet address
   * @param amount Amount of crypto to send
   * @param cryptoType Type of cryptocurrency (ETH, USDT, etc.)
   * @returns Transaction hash
   */
  static async sendCrypto(
    fromPrivateKey: string,
    toAddress: string,
    amount: string,
    cryptoType: string
  ): Promise<string> {
    try {
      console.log(`Sending ${amount} ${cryptoType} to ${toAddress}`);
      
      // Validate the recipient address
      if (!this.isValidAddress(toAddress, cryptoType)) {
        throw new Error(`Invalid ${cryptoType} address: ${toAddress}`);
      }
      
      // Validate amount
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error(`Invalid amount: ${amount}`);
      }
      
      // Create a wallet instance from the private key
      const ethersProvider = this.getEthersProvider(cryptoType);
      const wallet = new ethers.Wallet(fromPrivateKey, ethersProvider);
      
      // Handle different crypto types
      if (cryptoType === 'ETH') {
        // ETH transfer logic
        const balance = await ethersProvider.getBalance(wallet.address);
        const amountWei = ethers.parseEther(amount);
        
        if (balance < amountWei) {
          throw new Error(`Insufficient balance. Available: ${ethers.formatEther(balance)} ${cryptoType}, Required: ${amount} ${cryptoType}`);
        }
        
        // Estimate gas price and limit
        const gasPrice = await ethersProvider.getFeeData();
        const gasLimit = 21000; // Standard gas limit for ETH transfers
        
        // Create transaction object
        const tx = {
          to: toAddress,
          value: amountWei,
          gasLimit: gasLimit,
          maxFeePerGas: gasPrice.maxFeePerGas,
          maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas,
          nonce: await ethersProvider.getTransactionCount(wallet.address)
        };
        
        // Sign and send the transaction
        console.log('Sending ETH transaction with the following details:', tx);
        const transaction = await wallet.sendTransaction(tx);
        
        console.log(`Transaction sent! Hash: ${transaction.hash}`);
        console.log('Waiting for transaction confirmation...');
        
        // Wait for the transaction to be mined
        const receipt = await transaction.wait();
        
        console.log(`Transaction confirmed in block ${receipt?.blockNumber}`);
        return transaction.hash;
      } else if (cryptoType === 'USDT') {
        // USDT (ERC-20) transfer logic
        const tokenContract = this.getTokenContract('USDT');
        const connectedContract = tokenContract.connect(wallet) as IERC20Contract;
        
        // Get token decimals
        const decimals = await this.getTokenDecimals('USDT');
        
        //Get Nonce 
        
          const nonce= await ethersProvider.getTransactionCount(wallet.address)

        
        // Convert amount to token units
        const tokenAmount = ethers.parseUnits(amount, decimals);
        
        // Check token balance
        const tokenBalance = await tokenContract.balanceOf(wallet.address);
        
        if (tokenBalance < tokenAmount) {
          throw new Error(`Insufficient ${cryptoType} balance. Available: ${ethers.formatUnits(tokenBalance, decimals)} ${cryptoType}, Required: ${amount} ${cryptoType}`);
        }
        
        // Estimate gas for token transfer
        const gasEstimate = await connectedContract.estimateGas.transfer(
          toAddress, 
          tokenAmount,
        
        );
        
        // Add 20% buffer to gas estimate
        const gasLimit = gasEstimate + (gasEstimate / 5n);
        
        // Send token transfer transaction
        console.log(`Sending ${amount} ${cryptoType} to ${toAddress} with gas limit ${gasLimit}`);
        const transaction = await connectedContract.transfer(
          toAddress, 
          tokenAmount, 
          { gasLimit },
        );
        
        console.log(`Transaction sent! Hash: ${transaction.hash}`);
        console.log('Waiting for transaction confirmation...');
        
        // Wait for the transaction to be mined
        const receipt = await transaction.wait();
        
        console.log(`Transaction confirmed in block ${receipt?.blockNumber}`);
        return transaction.hash;
      } else {
        throw new Error(`Unsupported cryptocurrency: ${cryptoType}`);
      }
    } catch (error) {
      console.error('Error sending crypto:', error);
      throw new Error(`Failed to send ${cryptoType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get the wallet address from a private key
   * @param privateKey Private key
   * @returns Wallet address
   */
  static getAddressFromPrivateKey(privateKey: string): string {
    try {
      const wallet = new ethers.Wallet(privateKey);
      return wallet.address;
    } catch (error) {
      console.error('Error getting address from private key:', error);
      throw new Error('Invalid private key');
    }
  }

  /**
   * Validate a blockchain transaction
   * @param transactionHash Transaction hash to validate
   * @param walletAddress Expected wallet address
   * @param amount Expected amount
   * @param cryptoType Type of cryptocurrency
   * @returns True if transaction is valid
   */
  static async validateTransaction(
    transactionHash: string,
    walletAddress: string,
    amount: string,
    cryptoType: string
  ): Promise<boolean> {
    try {
      console.log(`Validating transaction ${transactionHash} for ${amount} ${cryptoType}`);
      
      const ethersProvider = this.getEthersProvider(cryptoType);
      
      // Get transaction details from the blockchain
      const txReceipt = await ethersProvider.getTransactionReceipt(transactionHash);
      
      if (!txReceipt) {
        console.error('Transaction not found');
        return false;
      }
      
      // Verify the transaction is confirmed
      if (!txReceipt.blockNumber) {
        console.error('Transaction not confirmed yet');
        return false;
      }
      
      // Get the full transaction
      const tx = await ethersProvider.getTransaction(transactionHash);
      
      if (cryptoType === 'ETH') {
        // For ETH, check if the recipient matches
        return tx?.to?.toLowerCase() === walletAddress.toLowerCase();
      } else if (cryptoType === 'USDT') {
        // For USDT, we need to decode the transaction data to verify the recipient and amount
        // This is a simplified check - just verifying it's a transaction to the USDT contract
        const tokenContract = this.getTokenContract('USDT');
        const contractAddress = typeof tokenContract.target === 'string' 
          ? tokenContract.target.toLowerCase() 
          : tokenContract.target.toString().toLowerCase();
        return tx?.to?.toLowerCase() === contractAddress;
      }
      
      return false;
    } catch (error) {
      console.error('Error validating transaction:', error);
      return false;
    }
  }

  /**
   * Get the contract for a token
   * @param tokenType Token type (e.g., 'USDT')
   * @returns Contract instance
   */
  static getTokenContract(tokenType: string): IERC20Contract {
    try {
      let contractAddress: string;
      
      // Determine which network we're using
      const network = 'mainnet'; // For testing, use Sepolia
      
      if (tokenType === 'USDT') {
        contractAddress = this.USDT_CONTRACT_ADDRESS[network];
      } else {
        throw new Error(`Unsupported token type: ${tokenType}`);
      }
      
      const ethersProvider = this.getEthersProvider(tokenType);
      return new ethers.Contract(
        contractAddress,
        this.ERC20_ABI,
        ethersProvider
      ) as unknown as IERC20Contract;
    } catch (error) {
      console.error('Error getting token contract:', error);
      throw new Error(`Failed to get ${tokenType} contract`);
    }
  }

  /**
   * Get token decimals
   * @param tokenType Token type (e.g., 'USDT')
   * @returns Number of decimals
   */
  static async getTokenDecimals(tokenType: string): Promise<number> {
    try {
      const contract = this.getTokenContract(tokenType);
      return await contract.decimals();
    } catch (error) {
      console.error('Error getting token decimals:', error);
      
      // Default decimals for common tokens
      if (tokenType === 'USDT') {
        return 6; // USDT typically uses 6 decimals
      }
      
      return 18; // Default to 18 decimals (like ETH)
    }
  }

  /**
   * Swap ETH for USDT or USDT for ETH
   * @param privateKey Private key of the wallet
   * @param amount Amount to swap
   * @param fromCrypto Source cryptocurrency (ETH or USDT)
   * @param toCrypto Target cryptocurrency (ETH or USDT)
   * @param slippagePercentage Maximum acceptable slippage (e.g., 0.5 for 0.5%)
   * @returns Transaction hash
   */
  static async swapCrypto(
    privateKey: string,
    amount: string,
    fromCrypto: string,
    toCrypto: string,
    slippagePercentage: number = 0.5
  ): Promise<string> {
    try {
      console.log(`Swapping ${amount} ${fromCrypto} to ${toCrypto}`);
      
      // Validate crypto types
      if ((fromCrypto !== 'ETH' && fromCrypto !== 'USDT') || 
          (toCrypto !== 'ETH' && toCrypto !== 'USDT')) {
        throw new Error('Only ETH and USDT swaps are supported');
      }
      
      if (fromCrypto === toCrypto) {
        throw new Error('Cannot swap a token for itself');
      }
      
      // Create wallet from private key
      const ethersProvider = this.getEthersProvider(fromCrypto);
      const wallet = new ethers.Wallet(privateKey, ethersProvider);
      console.log(`Using wallet: ${wallet.address}`);
      
      // Get the Uniswap router contract
      const network = 'mainnet'; // For testing
      const routerAddress = this.UNISWAP_ROUTER_ADDRESS[network];
      const router = new ethers.Contract(
        routerAddress,
        this.UNISWAP_ROUTER_ABI,
        ethersProvider
      ) as unknown as IUniswapRouterContract;
      
      // Connect wallet to router
      const connectedRouter = router.connect(wallet) as IUniswapRouterContract;
      
      // Set up swap parameters
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now
      
      if (fromCrypto === 'ETH' && toCrypto === 'USDT') {
        // ETH to USDT swap
        const amountIn = ethers.parseEther(amount);
        
        // Check if user has enough ETH
        const ethBalance = await ethersProvider.getBalance(wallet.address);
        if (ethBalance < amountIn) {
          throw new Error(`Insufficient ETH balance. Available: ${ethers.formatEther(ethBalance)} ETH`);
        }
        
        // Get USDT contract address
        const usdtAddress = this.USDT_CONTRACT_ADDRESS[network];
        
        // Create swap path: ETH -> WETH -> USDT
        const path = [this.WETH_ADDRESS[network], usdtAddress];
        
        // Get expected output amount
        const amounts = await router.getAmountsOut(amountIn, path);
        const expectedOutputAmount = amounts[1];
        
        // Calculate minimum output with slippage
        const slippageFactor = 1000 - (slippagePercentage * 10); // 0.5% -> 995
        const minOutputAmount = (expectedOutputAmount * BigInt(slippageFactor)) / 1000n;
        
        console.log(`Expected USDT output: ${ethers.formatUnits(expectedOutputAmount, 6)}`);
        console.log(`Minimum USDT output (with ${slippagePercentage}% slippage): ${ethers.formatUnits(minOutputAmount, 6)}`);
        
        // Execute the swap
        console.log('Executing ETH to USDT swap...');
        const tx = await connectedRouter.swapExactETHForTokens(
          minOutputAmount,
          path,
          wallet.address,
          deadline,
          { value: amountIn }
        );
        
        console.log(`Swap transaction sent: ${tx.hash}`);
        
        // Wait for transaction to be mined
        const receipt = await tx.wait();
        console.log(`Swap confirmed in block ${receipt?.blockNumber}`);
        
        return tx.hash;
      } else if (fromCrypto === 'USDT' && toCrypto === 'ETH') {
        // USDT to ETH swap
        const usdtContract = this.getTokenContract('USDT');
        const connectedUsdtContract = usdtContract.connect(wallet) as IERC20Contract;
        
        // Get USDT decimals
        const decimals = await this.getTokenDecimals('USDT');
        
        // Parse amount with proper decimals
        const amountIn = ethers.parseUnits(amount, decimals);
        
        // Check if user has enough USDT
        const usdtBalance = await usdtContract.balanceOf(wallet.address);
        if (usdtBalance < amountIn) {
          throw new Error(`Insufficient USDT balance. Available: ${ethers.formatUnits(usdtBalance, decimals)} USDT`);
        }
        
        // Get USDT contract address
        const usdtAddress = this.USDT_CONTRACT_ADDRESS[network];
        
        // Create swap path: USDT -> WETH
        const path = [usdtAddress, this.WETH_ADDRESS[network]];
        
        // Get expected output amount
        const amounts = await router.getAmountsOut(amountIn, path);
        const expectedOutputAmount = amounts[1];
        
        // Calculate minimum output with slippage
        const slippageFactor = 1000 - (slippagePercentage * 10); // 0.5% -> 995
        const minOutputAmount = (expectedOutputAmount * BigInt(slippageFactor)) / 1000n;
        
        console.log(`Expected ETH output: ${ethers.formatEther(expectedOutputAmount)}`);
        console.log(`Minimum ETH output (with ${slippagePercentage}% slippage): ${ethers.formatEther(minOutputAmount)}`);
        
        // Approve router to spend USDT
        console.log('Approving USDT for swap...');
        const approveTx = await connectedUsdtContract.approve(routerAddress, amountIn);
        await approveTx.wait();
        console.log('USDT approved for swap');
        
        // Execute the swap
        console.log('Executing USDT to ETH swap...');
        const tx = await connectedRouter.swapExactTokensForETH(
          amountIn,
          minOutputAmount,
          path,
          wallet.address,
          deadline
        );
        
        console.log(`Swap transaction sent: ${tx.hash}`);
        
        // Wait for transaction to be mined
        const receipt = await tx.wait();
        console.log(`Swap confirmed in block ${receipt?.blockNumber}`);
        
        return tx.hash;
      } else {
        throw new Error(`Unsupported swap pair: ${fromCrypto} to ${toCrypto}`);
      }
    } catch (error) {
      console.error('Error swapping crypto:', error);
      throw new Error(`Failed to swap ${fromCrypto} to ${toCrypto}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get estimated swap output amount
   * @param amount Amount to swap
   * @param fromCrypto Source cryptocurrency
   * @param toCrypto Target cryptocurrency
   * @returns Estimated output amount
   */
  static async getSwapEstimate(
    amount: string,
    fromCrypto: string,
    toCrypto: string
  ): Promise<string> {
    try {
      console.log(`Estimating swap of ${amount} ${fromCrypto} to ${toCrypto}`);
      
      // Validate crypto types
      if ((fromCrypto !== 'ETH' && fromCrypto !== 'USDT') || 
          (toCrypto !== 'ETH' && toCrypto !== 'USDT')) {
        throw new Error('Only ETH and USDT swaps are supported');
      }
      
      if (fromCrypto === toCrypto) {
        throw new Error('Cannot swap a token for itself');
      }
      
      // Get the Uniswap router contract
      const network = 'sepolia'; // For testing
      const ethersProvider = this.getEthersProvider(fromCrypto);
      const router = new ethers.Contract(
        this.UNISWAP_ROUTER_ADDRESS[network],
        this.UNISWAP_ROUTER_ABI,
        ethersProvider
      );
      
      try {
      if (fromCrypto === 'ETH' && toCrypto === 'USDT') {
        // ETH to USDT estimate
        const amountIn = ethers.parseEther(amount);
        
        // Create swap path: ETH -> WETH -> USDT
        const path = [this.WETH_ADDRESS[network], this.USDT_CONTRACT_ADDRESS[network]];
        
        // Get expected output amount
        const amounts = await router.getAmountsOut(amountIn, path);
        const expectedOutputAmount = amounts[1];
        
        // Format with USDT decimals (6)
        return ethers.formatUnits(expectedOutputAmount, 6);
      } else if (fromCrypto === 'USDT' && toCrypto === 'ETH') {
        // USDT to ETH estimate
        const decimals = await this.getTokenDecimals('USDT');
        const amountIn = ethers.parseUnits(amount, decimals);
        
        // Create swap path: USDT -> WETH
        const path = [this.USDT_CONTRACT_ADDRESS[network], this.WETH_ADDRESS[network]];
        
        // Get expected output amount
        const amounts = await router.getAmountsOut(amountIn, path);
        const expectedOutputAmount = amounts[1];
        
        // Format with ETH decimals (18)
        return ethers.formatEther(expectedOutputAmount);
      } else {
        throw new Error(`Unsupported swap pair: ${fromCrypto} to ${toCrypto}`);
        }
      } catch (error: unknown) {
        // Check for insufficient liquidity error
        if (
          error instanceof Error && 
          error.message && 
          error.message.includes('INSUFFICIENT_LIQUIDITY')
        ) {
          console.warn(`Insufficient liquidity for ${fromCrypto} to ${toCrypto} swap on testnet`);
          // Return a mock estimate for testing purposes
          if (fromCrypto === 'ETH' && toCrypto === 'USDT') {
            // Mock price: 1 ETH = 2053.64 USDT
            const ethAmount = parseFloat(amount);
            return (ethAmount * 2053.64).toFixed(6);
          } else if (fromCrypto === 'USDT' && toCrypto === 'ETH') {
            // Mock price: 1800 USDT = 1 ETH
            const usdtAmount = parseFloat(amount);
            return (usdtAmount / 2053.64).toFixed(18);
          }
        }
        throw error;
      }
    } catch (error) {
      console.error('Error estimating swap:', error);
      throw new Error(`Failed to estimate swap: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get wallet balance
   * @param address Wallet address
   * @param cryptoType Cryptocurrency type
   * @returns Balance as string
   */
  static async getWalletBalance(address: string, cryptoType: string): Promise<string> {
    try {
      switch (cryptoType.toUpperCase()) {
        case 'ETH':
          const ethersProvider = this.getEthersProvider(cryptoType);
          const balance = await ethersProvider.getBalance(address);
        return ethers.formatEther(balance);
        
        case 'BTC':
          return await this.getBitcoinBalance(address);
        
        case 'USDT':
        const contract = this.getTokenContract('USDT');
          const tokenBalance = await contract.balanceOf(address);
        const decimals = await this.getTokenDecimals('USDT');
          return ethers.formatUnits(tokenBalance, decimals);
        
        default:
        throw new Error(`Unsupported crypto type: ${cryptoType}`);
      }
    } catch (error) {
      console.error(`Error getting ${cryptoType} balance for ${address}:`, error);
      throw new Error(`Failed to get wallet balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get Bitcoin balance for a wallet address
   * @param address Bitcoin wallet address
   * @returns Balance in BTC as a string
   */
  static async getBitcoinBalance(address: string): Promise<string> {
    try {
      console.log(`Getting Bitcoin balance for address: ${address}`);
      
      // Determine which network to use
      const network = config.blockchain.network === 'mainnet' ? 'main' : 'test3';
      
      // Construct the API URL
      const apiUrl = `https://api.blockcypher.com/v1/btc/${network}/addrs/${address}/balance`;
      
      // Add token if available
      const tokenParam = config.blockchain.blockCypherToken 
        ? `?token=${config.blockchain.blockCypherToken}` 
        : '';
      
      // Make the API request
      const response = await axios.get(`${apiUrl}${tokenParam}`);
      
      if (!response.data) {
        throw new Error('No data returned from BlockCypher API');
      }
      
      // Get balance in satoshis
      const balanceSatoshis = response.data.balance || 0;
      const unconfirmedBalanceSatoshis = response.data.unconfirmed_balance || 0;
      
      // Convert satoshis to BTC (1 BTC = 100,000,000 satoshis)
      const confirmedBalance = balanceSatoshis / 100000000;
      const unconfirmedBalance = unconfirmedBalanceSatoshis / 100000000;
      const totalBalance = (balanceSatoshis + unconfirmedBalanceSatoshis) / 100000000;
      
      console.log(`Bitcoin balance for ${address}:`);
      console.log(`- Confirmed: ${confirmedBalance} BTC`);
      console.log(`- Unconfirmed: ${unconfirmedBalance} BTC`);
      console.log(`- Total: ${totalBalance} BTC`);
      
      // Return the total balance as a string with 8 decimal places
      return totalBalance.toFixed(8);
    } catch (error) {
      console.error('Error getting Bitcoin balance:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('BlockCypher API error:', error.response.data);
      }
      throw new Error(`Failed to get Bitcoin balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async transferEther(
    toAddress: string,
    amount: string,
    cryptoType: string
  ): Promise<string> {
    try {
      console.log('=== BLOCKCHAIN TRANSFER INITIATED ===');
      console.log('To address:', toAddress);
      console.log('Amount:', amount);
      console.log('Crypto type:', cryptoType);
      
      if (cryptoType === 'ETH') {
        // Get the appropriate provider based on crypto type
        const provider = BlockchainService.getEthersProvider(cryptoType);
        console.log('Using provider:', provider.getNetwork().then(network => network.name));
        
        // Create wallet from company private key
        const wallet = new ethers.Wallet(BlockchainService.COMPANY_WALLET_PRIVATE_KEY, provider);
        console.log('Company wallet address:', wallet.address);
        
        // Check company wallet balance
        const balance = await provider.getBalance(wallet.address);
        console.log('Company wallet balance:', ethers.formatEther(balance), 'ETH');
        
        // Convert amount to wei
        const amountInWei = ethers.parseEther(amount);
        console.log('Amount in wei:', amountInWei.toString());
        
        // Check if we have enough balance
        if (balance < amountInWei) {
          throw new Error(`Insufficient balance in company wallet: ${ethers.formatEther(balance)} ETH`);
        }

        const nonce = await provider.getTransactionCount(wallet.address, "latest");
        const gasLimit = await provider.estimateGas({ to: toAddress, value: amountInWei });
        const gasPrice = await provider.getFeeData().then(data => data.gasPrice);
        const chainId = (await provider.getNetwork()).chainId;
        
        // Create transaction
        const tx = {
          to: toAddress,
          value: amountInWei,
          nonce,
          gasLimit,
          gasPrice,
          chainId,
        };
        
        console.log('Transaction details:', tx);
        
        // Send transaction
        console.log('Sending transaction...');
        const txResponse = await wallet.sendTransaction(tx);
        console.log('Transaction sent:', txResponse.hash);
        
        // Wait for transaction to be mined
        console.log('Waiting for transaction to be mined...');
        const receipt = await txResponse.wait();
        console.log('Transaction mined:', receipt);
        
        console.log('=== BLOCKCHAIN TRANSFER COMPLETED ===');
        
        return txResponse.hash;
      } else if (cryptoType === 'USDT') {
        // USDT transfer logic
        const provider = BlockchainService.getEthersProvider(cryptoType);
        const wallet = new ethers.Wallet(BlockchainService.COMPANY_WALLET_PRIVATE_KEY, provider);
        const tokenContract = this.getTokenContract('USDT');
        const connectedContract = tokenContract.connect(wallet) as IERC20Contract;
        
        // Get token decimals
        const decimals = await this.getTokenDecimals('USDT');
        
        // Convert amount to token units
        const tokenAmount = ethers.parseUnits(amount, decimals);
        
        // Check token balance
        const tokenBalance = await tokenContract.balanceOf(wallet.address);
        
        if (tokenBalance < tokenAmount) {
          throw new Error(`Insufficient USDT balance in company wallet: ${ethers.formatUnits(tokenBalance, decimals)} USDT`);
        }
        
        // Estimate gas for token transfer
        const gasEstimate = await connectedContract.estimateGas.transfer(
          toAddress, 
          tokenAmount
        );
        
        // Add 20% buffer to gas estimate
        const gasLimit = gasEstimate + (gasEstimate / 5n);
        
        // Send token transfer transaction
        console.log(`Sending ${amount} USDT to ${toAddress} with gas limit ${gasLimit}`);
        const transaction = await connectedContract.transfer(
          toAddress, 
          tokenAmount, 
          { gasLimit }
        );
        
        console.log(`Transaction sent! Hash: ${transaction.hash}`);
        console.log('Waiting for transaction confirmation...');
        
        // Wait for the transaction to be mined
        const receipt = await transaction.wait();
        
        console.log(`Transaction confirmed in block ${receipt?.blockNumber}`);
        return transaction.hash;
      } else {
        throw new Error(`Unsupported cryptocurrency: ${cryptoType}`);
      }
    } catch (error) {
      console.error('Error transferring crypto:', error);
      throw new Error(`Failed to transfer crypto: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Transfer crypto from user wallet to company wallet
   * @param privateKey User's private key
   * @param amount Amount to transfer
   * @param cryptoType Cryptocurrency type
   * @returns Transaction hash
   */
  static async transferFromUserToCompany(
    privateKey: string,
    amount: string,
    cryptoType: string
  ): Promise<string> {
    try {
      console.log(`Transferring ${amount} ${cryptoType} to company wallet...`);
      
      // Get user wallet from private key
      const ethersProvider = this.getEthersProvider(cryptoType);
      const wallet = new ethers.Wallet(privateKey, ethersProvider);
      const fromAddress = wallet.address;
      
      // Get company wallet address
      const toAddress = this.COMPANY_WALLET_ADDRESS;
      
      if (cryptoType === 'ETH') {
        // Convert amount to wei
        const amountWei = ethers.parseEther(amount);
        
        // Check user balance
        const balance = await ethersProvider.getBalance(fromAddress);
        if (balance < amountWei) {
          throw new Error(`Insufficient ETH balance. Required: ${amount}, Available: ${ethers.formatEther(balance)}`);
        }
        
        // Estimate gas
        const gasPrice = await ethersProvider.getFeeData();
        const gasLimit = 21000n; // Standard ETH transfer gas limit
        const gasCost = gasLimit * (gasPrice.gasPrice ?? ethers.parseUnits('50', 'gwei'));
        
        // Ensure user has enough ETH for gas
        if (balance < amountWei + gasCost) {
          throw new Error(`Insufficient ETH balance for gas. Required: ${amount} + gas, Available: ${ethers.formatEther(balance)}`);
        }
        
        // Create transaction
        const tx = await wallet.sendTransaction({
          to: toAddress,
          value: amountWei,
          gasLimit
        });
        
        console.log(`ETH transfer initiated: ${tx.hash}`);
        
        // Wait for transaction to be mined
        const receipt = await tx.wait();
        console.log(`ETH transfer confirmed in block ${receipt?.blockNumber}`);
        
        return tx.hash;
      } else if (cryptoType === 'USDT') {
        // Get USDT contract
        const network = 'sepolia'; // For testing
        const usdtAddress = this.USDT_CONTRACT_ADDRESS[network];
        
        // Create contract instance
        const usdtContract = new ethers.Contract(
          usdtAddress,
          this.ERC20_ABI,
          ethersProvider
        ) as unknown as IERC20Contract;
        
        // Connect wallet to contract
        const connectedContract = usdtContract.connect(wallet) as IERC20Contract;
        
        // Get token decimals
        const decimals = await this.getTokenDecimals('USDT');
        
        // Convert amount to token units
        const tokenAmount = ethers.parseUnits(amount, decimals);
        
        // Check user balance
        const balance = await usdtContract.balanceOf(fromAddress);
        if (balance < tokenAmount) {
          throw new Error(`Insufficient USDT balance. Required: ${amount}, Available: ${ethers.formatUnits(balance, decimals)}`);
        }
        
        // Transfer tokens
        const tx = await connectedContract.transfer(toAddress, tokenAmount);
        
        console.log(`USDT transfer initiated: ${tx.hash}`);
        
        // Wait for transaction to be mined
        const receipt = await tx.wait();
        console.log(`USDT transfer confirmed in block ${receipt?.blockNumber}`);
        
        return tx.hash;
      } else {
        throw new Error(`Unsupported crypto type: ${cryptoType}`);
      }
    } catch (error) {
      console.error('Error transferring crypto to company wallet:', error);
      throw new Error(`Failed to transfer ${cryptoType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get estimated transfer fee for a cryptocurrency
   * @param cryptoType Type of cryptocurrency
   * @returns Estimated fee as a string
   */
  static async getTransferFee(cryptoType: string): Promise<string> {
    try {
      // In a real implementation, this would calculate the actual gas fee
      // For now, return fixed values based on crypto type
      switch (cryptoType.toUpperCase()) {
        case 'ETH':
          return '0.0001';
        case 'BTC':
          return '0.00005';
        case 'USDT':
          return '0.00002';
        default:
          return '0.0001';
      }
    } catch (error) {
      console.error(`Error getting transfer fee for ${cryptoType}:`, error);
      throw new Error(`Failed to get transfer fee for ${cryptoType}`);
    }
  }

  /**
   * Create a new wallet for the specified crypto type
   * @param crypto_type Type of cryptocurrency (ETH, BTC, etc.)
   * @returns Object containing address and private key
   */
  static async createWallet(crypto_type: string): Promise<{ address: string; privateKey: string }> {
    try {
      switch (crypto_type.toUpperCase()) {
        case 'ETH': {
          const wallet = ethers.Wallet.createRandom();
          return {
            address: wallet.address,
            privateKey: wallet.privateKey
          };
        }
        case 'BTC': {
          // Placeholder for BTC wallet creation
          return {
            address: `btc-address-${Date.now()}`,
            privateKey: `btc-private-key-${Date.now()}`
          };
        }
        case 'TRX':
        case 'USDT_TRC20': {
          // Create a new Tron account
          const account = this.tronWeb.utils.accounts.generateAccount();
          return {
            address: account.address.base58,
            privateKey: account.privateKey
          };
        }
        default:
          throw new Error(`Unsupported crypto type: ${crypto_type}`);
      }
    } catch (error) {
      console.error(`Error creating ${crypto_type} wallet:`, error);
      throw new Error(`Failed to create ${crypto_type} wallet`);
    }
  }

  /**
   * Create a new Bitcoin wallet
   * @returns Bitcoin wallet details
   */
  static async createBitcoinWallet(): Promise<{
    address: string;
    private: string;
    public: string;
    wif: string;
  }> {
    try {
      const apiUrl = `https://api.blockcypher.com/v1/btc/main`;
      const token = config.blockchain.blockCypherToken;
      
      console.log(`Creating new Bitcoin wallet on main network`);
      
      const response = await axios.post(`${apiUrl}/addrs?token=${token}`);
      
      console.log(`New Bitcoin wallet created: ${response.data.address}`);
      
      return {
        address: response.data.address,
        private: response.data.private,
        public: response.data.public,
        wif: response.data.wif
      };
    } catch (error) {
      console.error('Error creating Bitcoin wallet:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('BlockCypher API error:', error.response.data);
      }
      throw new Error('Failed to create Bitcoin wallet');
    }
  }

  /**
 * Send Bitcoin from one wallet to another using bitcore-lib
 * @param fromPrivateKey Sender's private key (WIF format)
 * @param toAddress Receiver's BTC address
 * @param amount Amount in BTC
 * @returns Transaction details
 */
static async sendBitcoin(
toAddress: string, amount: string, ): Promise<{ txHash: string; txUrl: string }> {
  try {
    // Import bitcore-lib
    const bitcore = require('bitcore-lib');
    
    // Network selection
    const network = config.blockchain.network === 'mainnet' 
      ? bitcore.Networks.livenet 
      : bitcore.Networks.testnet;
    const fromPrivateKey = "";
    // Create private key from WIF
    const privateKey = new bitcore.PrivateKey.fromWIF(fromPrivateKey);
    const fromAddress = privateKey.toAddress(network).toString();
    
    console.log(`Sending ${amount} BTC from ${fromAddress} to ${toAddress}`);
    
    // Convert BTC to satoshis
    const satoshis = Math.floor(parseFloat(amount) * 100000000);
    
    // Get UTXOs for the address
    const utxosUrl = config.blockchain.network === 'mainnet'
      ? `https://api.blockcypher.com/v1/btc/main/addrs/${fromAddress}?unspentOnly=true&token=${config.blockchain.blockCypherToken}`
      : `https://api.blockcypher.com/v1/btc/test3/addrs/${fromAddress}?unspentOnly=true&token=${config.blockchain.blockCypherToken}`;
    
    const utxoResponse = await axios.get(utxosUrl);
    if (!utxoResponse.data.txrefs || utxoResponse.data.txrefs.length === 0) {
      throw new Error(`No unspent outputs found for address ${fromAddress}`);
    }
    
    // Format UTXOs for bitcore
    const utxos = utxoResponse.data.txrefs.map((utxo: any) => {
      return {
        txId: utxo.tx_hash,
        outputIndex: utxo.tx_output_n,
        address: fromAddress,
        script: new bitcore.Script(new bitcore.Address(fromAddress, network)).toHex(),
        satoshis: utxo.value
      };
    });
    
    // Calculate total available balance
    const totalBalance = utxos.reduce((sum: number, utxo: any) => sum + utxo.satoshis, 0);
    
    if (totalBalance < satoshis) {
      throw new Error(`Insufficient balance. Required: ${amount} BTC, Available: ${totalBalance / 100000000} BTC`);
    }
    
    // Create transaction
    const transaction = new bitcore.Transaction()
      .from(utxos)
      .to(toAddress, satoshis)
      .change(fromAddress) // Send change back to sender
      .fee(5000) // Set appropriate fee (5000 satoshis in this example)
      .sign(privateKey);
    
    // Verify transaction is valid
    const isValid = transaction.isFullySigned() && transaction.verify();
    if (!isValid) {
      throw new Error('Transaction validation failed');
    }

    // Get transaction as hex string
    const txHex = transaction.serialize();
    
    // Broadcast transaction
    const broadcastUrl = config.blockchain.network === 'mainnet'
      ? 'https://api.blockcypher.com/v1/btc/main/txs/push'
      : 'https://api.blockcypher.com/v1/btc/test3/txs/push';
    
    const broadcastResponse = await axios.post(broadcastUrl, {
      tx: txHex
    });
    
    const txHash = broadcastResponse.data.tx.hash;
    const explorerUrl = config.blockchain.network === 'mainnet'
      ? `https://www.blockchain.com/btc/tx/${txHash}`
      : `https://www.blockchain.com/btc-testnet/tx/${txHash}`;
    
    console.log(`Bitcoin transaction sent! TX Hash: ${txHash}`);
    
    return {
      txHash,
      txUrl: explorerUrl
    };
    } catch (error) {
    console.error('Error sending Bitcoin:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('API error:', error.response.data);
    }
    throw new Error(`Failed to send Bitcoin: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}


  
}

// Initialize the service when the module is loaded
export const blockchainService = new BlockchainService();

