"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blockchainService = exports.BlockchainService = void 0;
const walletService_1 = require("./walletService");
const ethers_1 = require("ethers");
const env_1 = require("../../config/env");
const blockchainFactory_1 = require("./blockchain/blockchainFactory");
const circuitBreakerDecorator_1 = require("../utils/circuitBreakerDecorator");
const serviceErrors_1 = require("../utils/serviceErrors");
class BlockchainService {
    static initialize() {
        try {
            this.provider = blockchainFactory_1.BlockchainFactory.getProvider('ethereum');
            // Apply circuit breakers to critical methods
            (0, circuitBreakerDecorator_1.withCircuitBreaker)(this.provider, 'transferCrypto', {
                failureThreshold: 3,
                resetTimeout: 60000 // 1 minute
            });
            (0, circuitBreakerDecorator_1.withCircuitBreaker)(this.provider, 'getBalance', {
                failureThreshold: 5,
                resetTimeout: 30000 // 30 seconds
            });
            console.log('BlockchainService initialized successfully');
        }
        catch (error) {
            console.error('Failed to initialize BlockchainService:', error);
            throw error;
        }
    }
    static async getBalance(address, cryptoType = 'ETH') {
        try {
            return await this.provider.getBalance(address, cryptoType);
        }
        catch (error) {
            throw (0, serviceErrors_1.handleServiceError)(error, 'blockchain');
        }
    }
    static async verifyTransaction(txHash, cryptoType) {
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
        }
        catch (error) {
            console.error(`Error verifying transaction ${txHash}:`, error);
            return false;
        }
    }
    static async estimateGas(to, amount, cryptoType = 'ETH') {
        try {
            // Use getEthersProvider instead of this.provider
            const ethersProvider = this.getEthersProvider(cryptoType);
            if (cryptoType === 'ETH') {
                const gasEstimate = await ethersProvider.estimateGas({
                    to,
                    value: ethers_1.ethers.parseEther(amount)
                });
                return gasEstimate.toString();
            }
            else {
                // For token transfers
                const tokenContract = this.getTokenContract(cryptoType);
                const decimals = await tokenContract.decimals();
                const tokenAmount = ethers_1.ethers.parseUnits(amount, decimals);
                // Use the connected contract for estimation
                const gasEstimate = await tokenContract.estimateGas.transfer(to, tokenAmount);
                return gasEstimate.toString();
            }
        }
        catch (error) {
            console.error(`Error estimating gas for ${cryptoType} transfer:`, error);
            throw new Error(`Failed to estimate gas: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // Provider method - renamed to avoid confusion
    static getEthersProvider(cryptoType) {
        try {
            // For testing, use Sepolia testnet
            const network = 'sepolia';
            // Use Alchemy for testnet
            const alchemyUrl = `https://eth-${network}.g.alchemy.com/v2/${env_1.config.blockchain.alchemyApiKey}`;
            console.log(`Using ${network} testnet with Alchemy`);
            const provider = new ethers_1.ethers.JsonRpcProvider(alchemyUrl);
            // Set a reasonable timeout
            provider.pollingInterval = 5000; // 5 seconds
            return provider;
        }
        catch (error) {
            console.error('Error creating provider:', error);
            throw new Error('Failed to create blockchain provider');
        }
    }
    // Validate address method
    static async isValidAddress(address, cryptoType) {
        try {
            // For ETH and ERC-20 tokens like USDT, use WalletService
            if (cryptoType === 'ETH' || cryptoType === 'USDT') {
                return await walletService_1.WalletService.verifyAddress(address);
            }
            // Add validation for other crypto types as needed
            return false;
        }
        catch (error) {
            console.error('Error validating address:', error);
            return false;
        }
    }
    // Transfer crypto from company wallet
    static async transferCrypto(toAddress, amount, cryptoType) {
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
                const wallet = new ethers_1.ethers.Wallet(BlockchainService.COMPANY_WALLET_PRIVATE_KEY, provider);
                console.log('Company wallet address:', wallet.address);
                // Check company wallet balance
                const balance = await provider.getBalance(wallet.address);
                console.log('Company wallet balance:', ethers_1.ethers.formatEther(balance), 'ETH');
                // Convert amount to wei
                const amountInWei = ethers_1.ethers.parseEther(amount);
                console.log('Amount in wei:', amountInWei.toString());
                // Check if we have enough balance
                if (balance < amountInWei) {
                    throw new Error(`Insufficient balance in company wallet: ${ethers_1.ethers.formatEther(balance)} ETH`);
                }
                // Create transaction
                const tx = {
                    to: toAddress,
                    value: amountInWei
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
            }
            else if (cryptoType === 'USDT') {
                // USDT transfer logic
                const provider = BlockchainService.getEthersProvider(cryptoType);
                const wallet = new ethers_1.ethers.Wallet(BlockchainService.COMPANY_WALLET_PRIVATE_KEY, provider);
                const tokenContract = this.getTokenContract('USDT');
                const connectedContract = tokenContract.connect(wallet);
                // Get token decimals
                const decimals = await this.getTokenDecimals('USDT');
                // Convert amount to token units
                const tokenAmount = ethers_1.ethers.parseUnits(amount, decimals);
                // Check token balance
                const tokenBalance = await tokenContract.balanceOf(wallet.address);
                if (tokenBalance < tokenAmount) {
                    throw new Error(`Insufficient USDT balance in company wallet: ${ethers_1.ethers.formatUnits(tokenBalance, decimals)} USDT`);
                }
                // Estimate gas for token transfer
                const gasEstimate = await connectedContract.estimateGas.transfer(toAddress, tokenAmount);
                // Add 20% buffer to gas estimate
                const gasLimit = gasEstimate + (gasEstimate / 5n);
                // Send token transfer transaction
                console.log(`Sending ${amount} USDT to ${toAddress} with gas limit ${gasLimit}`);
                const transaction = await connectedContract.transfer(toAddress, tokenAmount, { gasLimit });
                console.log(`Transaction sent! Hash: ${transaction.hash}`);
                console.log('Waiting for transaction confirmation...');
                // Wait for the transaction to be mined
                const receipt = await transaction.wait();
                console.log(`Transaction confirmed in block ${receipt?.blockNumber}`);
                return transaction.hash;
            }
            else {
                throw new Error(`Unsupported cryptocurrency: ${cryptoType}`);
            }
        }
        catch (error) {
            console.error('Error transferring crypto:', error);
            throw new Error(`Failed to transfer crypto: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    static async processBuyRequest(userId, amount, cryptoType, nairaValue, userWalletAddress) {
        // Transfer crypto from company wallet to user wallet
        const txHash = await this.transferCrypto(userWalletAddress, amount, cryptoType);
        return txHash;
    }
    static async processSellRequest(userId, amount, cryptoType, nairaValue, userWalletAddress, userWalletPrivateKey) {
        // Get company wallet
        const companyWallet = walletService_1.WalletService.getCompanyWallet();
        // Transfer crypto from user wallet to company wallet
        const txHash = await this.sendCrypto(userWalletPrivateKey, companyWallet.address, amount, cryptoType);
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
    static async sendCrypto(fromPrivateKey, toAddress, amount, cryptoType) {
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
            const wallet = new ethers_1.ethers.Wallet(fromPrivateKey, ethersProvider);
            // Handle different crypto types
            if (cryptoType === 'ETH') {
                // ETH transfer logic
                const balance = await ethersProvider.getBalance(wallet.address);
                const amountWei = ethers_1.ethers.parseEther(amount);
                if (balance < amountWei) {
                    throw new Error(`Insufficient balance. Available: ${ethers_1.ethers.formatEther(balance)} ${cryptoType}, Required: ${amount} ${cryptoType}`);
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
            }
            else if (cryptoType === 'USDT') {
                // USDT (ERC-20) transfer logic
                const tokenContract = this.getTokenContract('USDT');
                const connectedContract = tokenContract.connect(wallet);
                // Get token decimals
                const decimals = await this.getTokenDecimals('USDT');
                // Convert amount to token units
                const tokenAmount = ethers_1.ethers.parseUnits(amount, decimals);
                // Check token balance
                const tokenBalance = await tokenContract.balanceOf(wallet.address);
                if (tokenBalance < tokenAmount) {
                    throw new Error(`Insufficient ${cryptoType} balance. Available: ${ethers_1.ethers.formatUnits(tokenBalance, decimals)} ${cryptoType}, Required: ${amount} ${cryptoType}`);
                }
                // Estimate gas for token transfer
                const gasEstimate = await connectedContract.estimateGas.transfer(toAddress, tokenAmount);
                // Add 20% buffer to gas estimate
                const gasLimit = gasEstimate + (gasEstimate / 5n);
                // Send token transfer transaction
                console.log(`Sending ${amount} ${cryptoType} to ${toAddress} with gas limit ${gasLimit}`);
                const transaction = await connectedContract.transfer(toAddress, tokenAmount, { gasLimit });
                console.log(`Transaction sent! Hash: ${transaction.hash}`);
                console.log('Waiting for transaction confirmation...');
                // Wait for the transaction to be mined
                const receipt = await transaction.wait();
                console.log(`Transaction confirmed in block ${receipt?.blockNumber}`);
                return transaction.hash;
            }
            else {
                throw new Error(`Unsupported cryptocurrency: ${cryptoType}`);
            }
        }
        catch (error) {
            console.error('Error sending crypto:', error);
            throw new Error(`Failed to send ${cryptoType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get the wallet address from a private key
     * @param privateKey Private key
     * @returns Wallet address
     */
    static getAddressFromPrivateKey(privateKey) {
        try {
            const wallet = new ethers_1.ethers.Wallet(privateKey);
            return wallet.address;
        }
        catch (error) {
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
    static async validateTransaction(transactionHash, walletAddress, amount, cryptoType) {
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
            }
            else if (cryptoType === 'USDT') {
                // For USDT, we need to decode the transaction data to verify the recipient and amount
                // This is a simplified check - just verifying it's a transaction to the USDT contract
                const tokenContract = this.getTokenContract('USDT');
                const contractAddress = typeof tokenContract.target === 'string'
                    ? tokenContract.target.toLowerCase()
                    : tokenContract.target.toString().toLowerCase();
                return tx?.to?.toLowerCase() === contractAddress;
            }
            return false;
        }
        catch (error) {
            console.error('Error validating transaction:', error);
            return false;
        }
    }
    /**
     * Get the contract for a token
     * @param tokenType Token type (e.g., 'USDT')
     * @returns Contract instance
     */
    static getTokenContract(tokenType) {
        try {
            let contractAddress;
            // Determine which network we're using
            const network = 'sepolia'; // For testing, use Sepolia
            if (tokenType === 'USDT') {
                contractAddress = this.USDT_CONTRACT_ADDRESS[network];
            }
            else {
                throw new Error(`Unsupported token type: ${tokenType}`);
            }
            const ethersProvider = this.getEthersProvider(tokenType);
            return new ethers_1.ethers.Contract(contractAddress, this.ERC20_ABI, ethersProvider);
        }
        catch (error) {
            console.error('Error getting token contract:', error);
            throw new Error(`Failed to get ${tokenType} contract`);
        }
    }
    /**
     * Get token decimals
     * @param tokenType Token type (e.g., 'USDT')
     * @returns Number of decimals
     */
    static async getTokenDecimals(tokenType) {
        try {
            const contract = this.getTokenContract(tokenType);
            return await contract.decimals();
        }
        catch (error) {
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
    static async swapCrypto(privateKey, amount, fromCrypto, toCrypto, slippagePercentage = 0.5) {
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
            const wallet = new ethers_1.ethers.Wallet(privateKey, ethersProvider);
            console.log(`Using wallet: ${wallet.address}`);
            // Get the Uniswap router contract
            const network = 'sepolia'; // For testing
            const routerAddress = this.UNISWAP_ROUTER_ADDRESS[network];
            const router = new ethers_1.ethers.Contract(routerAddress, this.UNISWAP_ROUTER_ABI, ethersProvider);
            // Connect wallet to router
            const connectedRouter = router.connect(wallet);
            // Set up swap parameters
            const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now
            if (fromCrypto === 'ETH' && toCrypto === 'USDT') {
                // ETH to USDT swap
                const amountIn = ethers_1.ethers.parseEther(amount);
                // Check if user has enough ETH
                const ethBalance = await ethersProvider.getBalance(wallet.address);
                if (ethBalance < amountIn) {
                    throw new Error(`Insufficient ETH balance. Available: ${ethers_1.ethers.formatEther(ethBalance)} ETH`);
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
                console.log(`Expected USDT output: ${ethers_1.ethers.formatUnits(expectedOutputAmount, 6)}`);
                console.log(`Minimum USDT output (with ${slippagePercentage}% slippage): ${ethers_1.ethers.formatUnits(minOutputAmount, 6)}`);
                // Execute the swap
                console.log('Executing ETH to USDT swap...');
                const tx = await connectedRouter.swapExactETHForTokens(minOutputAmount, path, wallet.address, deadline, { value: amountIn });
                console.log(`Swap transaction sent: ${tx.hash}`);
                // Wait for transaction to be mined
                const receipt = await tx.wait();
                console.log(`Swap confirmed in block ${receipt?.blockNumber}`);
                return tx.hash;
            }
            else if (fromCrypto === 'USDT' && toCrypto === 'ETH') {
                // USDT to ETH swap
                const usdtContract = this.getTokenContract('USDT');
                const connectedUsdtContract = usdtContract.connect(wallet);
                // Get USDT decimals
                const decimals = await this.getTokenDecimals('USDT');
                // Parse amount with proper decimals
                const amountIn = ethers_1.ethers.parseUnits(amount, decimals);
                // Check if user has enough USDT
                const usdtBalance = await usdtContract.balanceOf(wallet.address);
                if (usdtBalance < amountIn) {
                    throw new Error(`Insufficient USDT balance. Available: ${ethers_1.ethers.formatUnits(usdtBalance, decimals)} USDT`);
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
                console.log(`Expected ETH output: ${ethers_1.ethers.formatEther(expectedOutputAmount)}`);
                console.log(`Minimum ETH output (with ${slippagePercentage}% slippage): ${ethers_1.ethers.formatEther(minOutputAmount)}`);
                // Approve router to spend USDT
                console.log('Approving USDT for swap...');
                const approveTx = await connectedUsdtContract.approve(routerAddress, amountIn);
                await approveTx.wait();
                console.log('USDT approved for swap');
                // Execute the swap
                console.log('Executing USDT to ETH swap...');
                const tx = await connectedRouter.swapExactTokensForETH(amountIn, minOutputAmount, path, wallet.address, deadline);
                console.log(`Swap transaction sent: ${tx.hash}`);
                // Wait for transaction to be mined
                const receipt = await tx.wait();
                console.log(`Swap confirmed in block ${receipt?.blockNumber}`);
                return tx.hash;
            }
            else {
                throw new Error(`Unsupported swap pair: ${fromCrypto} to ${toCrypto}`);
            }
        }
        catch (error) {
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
    static async getSwapEstimate(amount, fromCrypto, toCrypto) {
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
            const router = new ethers_1.ethers.Contract(this.UNISWAP_ROUTER_ADDRESS[network], this.UNISWAP_ROUTER_ABI, ethersProvider);
            try {
                if (fromCrypto === 'ETH' && toCrypto === 'USDT') {
                    // ETH to USDT estimate
                    const amountIn = ethers_1.ethers.parseEther(amount);
                    // Create swap path: ETH -> WETH -> USDT
                    const path = [this.WETH_ADDRESS[network], this.USDT_CONTRACT_ADDRESS[network]];
                    // Get expected output amount
                    const amounts = await router.getAmountsOut(amountIn, path);
                    const expectedOutputAmount = amounts[1];
                    // Format with USDT decimals (6)
                    return ethers_1.ethers.formatUnits(expectedOutputAmount, 6);
                }
                else if (fromCrypto === 'USDT' && toCrypto === 'ETH') {
                    // USDT to ETH estimate
                    const decimals = await this.getTokenDecimals('USDT');
                    const amountIn = ethers_1.ethers.parseUnits(amount, decimals);
                    // Create swap path: USDT -> WETH
                    const path = [this.USDT_CONTRACT_ADDRESS[network], this.WETH_ADDRESS[network]];
                    // Get expected output amount
                    const amounts = await router.getAmountsOut(amountIn, path);
                    const expectedOutputAmount = amounts[1];
                    // Format with ETH decimals (18)
                    return ethers_1.ethers.formatEther(expectedOutputAmount);
                }
                else {
                    throw new Error(`Unsupported swap pair: ${fromCrypto} to ${toCrypto}`);
                }
            }
            catch (error) {
                // Check for insufficient liquidity error
                if (error instanceof Error &&
                    error.message &&
                    error.message.includes('INSUFFICIENT_LIQUIDITY')) {
                    console.warn(`Insufficient liquidity for ${fromCrypto} to ${toCrypto} swap on testnet`);
                    // Return a mock estimate for testing purposes
                    if (fromCrypto === 'ETH' && toCrypto === 'USDT') {
                        // Mock price: 1 ETH = 1800 USDT
                        const ethAmount = parseFloat(amount);
                        return (ethAmount * 1800).toFixed(6);
                    }
                    else if (fromCrypto === 'USDT' && toCrypto === 'ETH') {
                        // Mock price: 1800 USDT = 1 ETH
                        const usdtAmount = parseFloat(amount);
                        return (usdtAmount / 1800).toFixed(18);
                    }
                }
                throw error;
            }
        }
        catch (error) {
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
    static async getWalletBalance(address, cryptoType) {
        try {
            const ethersProvider = this.getEthersProvider(cryptoType);
            if (cryptoType === 'ETH') {
                const balance = await ethersProvider.getBalance(address);
                return ethers_1.ethers.formatEther(balance);
            }
            else if (cryptoType === 'USDT') {
                const contract = this.getTokenContract('USDT');
                const balance = await contract.balanceOf(address);
                const decimals = await this.getTokenDecimals('USDT');
                return ethers_1.ethers.formatUnits(balance, decimals);
            }
            else {
                throw new Error(`Unsupported crypto type: ${cryptoType}`);
            }
        }
        catch (error) {
            console.error(`Error getting ${cryptoType} balance for ${address}:`, error);
            throw new Error(`Failed to get wallet balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Transfer crypto from user wallet to company wallet
     * @param privateKey User's private key
     * @param amount Amount to transfer
     * @param cryptoType Cryptocurrency type
     * @returns Transaction hash
     */
    static async transferFromUserToCompany(privateKey, amount, cryptoType) {
        try {
            console.log(`Transferring ${amount} ${cryptoType} to company wallet...`);
            // Get user wallet from private key
            const ethersProvider = this.getEthersProvider(cryptoType);
            const wallet = new ethers_1.ethers.Wallet(privateKey, ethersProvider);
            const fromAddress = wallet.address;
            // Get company wallet address
            const toAddress = this.COMPANY_WALLET_ADDRESS;
            if (cryptoType === 'ETH') {
                // Convert amount to wei
                const amountWei = ethers_1.ethers.parseEther(amount);
                // Check user balance
                const balance = await ethersProvider.getBalance(fromAddress);
                if (balance < amountWei) {
                    throw new Error(`Insufficient ETH balance. Required: ${amount}, Available: ${ethers_1.ethers.formatEther(balance)}`);
                }
                // Estimate gas
                const gasPrice = await ethersProvider.getFeeData();
                const gasLimit = 21000n; // Standard ETH transfer gas limit
                const gasCost = gasLimit * (gasPrice.gasPrice ?? ethers_1.ethers.parseUnits('50', 'gwei'));
                // Ensure user has enough ETH for gas
                if (balance < amountWei + gasCost) {
                    throw new Error(`Insufficient ETH balance for gas. Required: ${amount} + gas, Available: ${ethers_1.ethers.formatEther(balance)}`);
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
            }
            else if (cryptoType === 'USDT') {
                // Get USDT contract
                const network = 'sepolia'; // For testing
                const usdtAddress = this.USDT_CONTRACT_ADDRESS[network];
                // Create contract instance
                const usdtContract = new ethers_1.ethers.Contract(usdtAddress, this.ERC20_ABI, ethersProvider);
                // Connect wallet to contract
                const connectedContract = usdtContract.connect(wallet);
                // Get token decimals
                const decimals = await this.getTokenDecimals('USDT');
                // Convert amount to token units
                const tokenAmount = ethers_1.ethers.parseUnits(amount, decimals);
                // Check user balance
                const balance = await usdtContract.balanceOf(fromAddress);
                if (balance < tokenAmount) {
                    throw new Error(`Insufficient USDT balance. Required: ${amount}, Available: ${ethers_1.ethers.formatUnits(balance, decimals)}`);
                }
                // Transfer tokens
                const tx = await connectedContract.transfer(toAddress, tokenAmount);
                console.log(`USDT transfer initiated: ${tx.hash}`);
                // Wait for transaction to be mined
                const receipt = await tx.wait();
                console.log(`USDT transfer confirmed in block ${receipt?.blockNumber}`);
                return tx.hash;
            }
            else {
                throw new Error(`Unsupported crypto type: ${cryptoType}`);
            }
        }
        catch (error) {
            console.error('Error transferring crypto to company wallet:', error);
            throw new Error(`Failed to transfer ${cryptoType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
exports.BlockchainService = BlockchainService;
// Add static properties
BlockchainService.COMPANY_WALLET_PRIVATE_KEY = env_1.config.blockchain.companyWallet.privateKey;
BlockchainService.COMPANY_WALLET_ADDRESS = env_1.config.blockchain.companyWallet.address;
// Add USDT contract information
BlockchainService.USDT_CONTRACT_ADDRESS = {
    mainnet: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    sepolia: '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06' // This is a test USDT on Sepolia
};
// ERC-20 ABI for token transfers
BlockchainService.ERC20_ABI = [
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
BlockchainService.UNISWAP_ROUTER_ADDRESS = {
    mainnet: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    sepolia: '0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008' // Uniswap V2 Router on Sepolia
};
BlockchainService.WETH_ADDRESS = {
    mainnet: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    sepolia: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14' // Wrapped ETH on Sepolia
};
// Uniswap Router ABI (simplified for swapping)
BlockchainService.UNISWAP_ROUTER_ABI = [
    'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
    'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
    'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)'
];
// Initialize the service when the module is loaded
exports.blockchainService = new BlockchainService();
