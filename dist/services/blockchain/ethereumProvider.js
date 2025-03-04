"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EthereumProvider = void 0;
const ethers_1 = require("ethers");
const serviceErrors_1 = require("../../utils/serviceErrors");
const env_1 = require("../../../config/env");
class EthereumProvider {
    constructor() {
        try {
            // Use Alchemy for provider
            const alchemyUrl = `https://eth-sepolia.g.alchemy.com/v2/${env_1.config.blockchain.alchemyApiKey}`;
            this.provider = new ethers_1.ethers.JsonRpcProvider(alchemyUrl);
            // Set up company wallet
            if (!env_1.config.blockchain.companyWallet.privateKey) {
                throw new serviceErrors_1.BlockchainError('Company wallet private key is not configured');
            }
            this.companyWallet = new ethers_1.ethers.Wallet(env_1.config.blockchain.companyWallet.privateKey, this.provider);
            console.log('Ethereum provider initialized with company wallet:', this.companyWallet.address.substring(0, 10) + '...');
        }
        catch (error) {
            throw (0, serviceErrors_1.handleServiceError)(error, 'blockchain');
        }
    }
    async getBalance(address, cryptoType) {
        try {
            if (cryptoType === 'ETH') {
                const balance = await this.provider.getBalance(address);
                return ethers_1.ethers.formatEther(balance);
            }
            else {
                // For ERC20 tokens, get token contract and call balanceOf
                const tokenContract = await this.getTokenContract(cryptoType);
                const balance = await tokenContract.balanceOf(address);
                const decimals = await tokenContract.decimals();
                return ethers_1.ethers.formatUnits(balance, decimals);
            }
        }
        catch (error) {
            throw (0, serviceErrors_1.handleServiceError)(error, 'blockchain');
        }
    }
    async transferCrypto(to, amount, cryptoType) {
        try {
            if (cryptoType === 'ETH') {
                // Transfer ETH
                const tx = await this.companyWallet.sendTransaction({
                    to,
                    value: ethers_1.ethers.parseEther(amount)
                });
                console.log(`ETH transfer initiated: ${tx.hash}`);
                const receipt = await tx.wait();
                return tx.hash;
            }
            else {
                // Transfer ERC20 token
                const tokenContract = await this.getTokenContract(cryptoType);
                const decimals = await tokenContract.decimals();
                const tokenAmount = ethers_1.ethers.parseUnits(amount, decimals);
                const tx = await tokenContract.transfer(to, tokenAmount);
                console.log(`${cryptoType} transfer initiated: ${tx.hash}`);
                const receipt = await tx.wait();
                return tx.hash;
            }
        }
        catch (error) {
            throw (0, serviceErrors_1.handleServiceError)(error, 'blockchain');
        }
    }
    async verifyTransaction(txHash) {
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
        }
        catch (error) {
            throw (0, serviceErrors_1.handleServiceError)(error, 'blockchain');
        }
    }
    async estimateGas(to, amount, cryptoType) {
        try {
            if (cryptoType === 'ETH') {
                const gasEstimate = await this.provider.estimateGas({
                    from: this.companyWallet.address,
                    to,
                    value: ethers_1.ethers.parseEther(amount)
                });
                return gasEstimate.toString();
            }
            else {
                const tokenContract = await this.getTokenContract(cryptoType);
                const decimals = await tokenContract.decimals();
                const tokenAmount = ethers_1.ethers.parseUnits(amount, decimals);
                const gasEstimate = await tokenContract.estimateGas.transfer(to, tokenAmount);
                return gasEstimate.toString();
            }
        }
        catch (error) {
            throw (0, serviceErrors_1.handleServiceError)(error, 'blockchain');
        }
    }
    // IERC20Provider methods
    async getTokenBalance(tokenAddress, ownerAddress) {
        try {
            const tokenContract = new ethers_1.ethers.Contract(tokenAddress, ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'], this.provider);
            const balance = await tokenContract.balanceOf(ownerAddress);
            const decimals = await tokenContract.decimals();
            return ethers_1.ethers.formatUnits(balance, decimals);
        }
        catch (error) {
            throw (0, serviceErrors_1.handleServiceError)(error, 'blockchain');
        }
    }
    async transfer(tokenAddress, to, amount) {
        try {
            const tokenContract = new ethers_1.ethers.Contract(tokenAddress, ['function transfer(address, uint256) returns (bool)', 'function decimals() view returns (uint8)'], this.companyWallet);
            const decimals = await tokenContract.decimals();
            const tokenAmount = ethers_1.ethers.parseUnits(amount, decimals);
            const tx = await tokenContract.transfer(to, tokenAmount);
            await tx.wait();
            return tx.hash;
        }
        catch (error) {
            throw (0, serviceErrors_1.handleServiceError)(error, 'blockchain');
        }
    }
    async approve(tokenAddress, spender, amount) {
        try {
            const tokenContract = new ethers_1.ethers.Contract(tokenAddress, ['function approve(address, uint256) returns (bool)', 'function decimals() view returns (uint8)'], this.companyWallet);
            const decimals = await tokenContract.decimals();
            const tokenAmount = ethers_1.ethers.parseUnits(amount, decimals);
            const tx = await tokenContract.approve(spender, tokenAmount);
            await tx.wait();
            return tx.hash;
        }
        catch (error) {
            throw (0, serviceErrors_1.handleServiceError)(error, 'blockchain');
        }
    }
    // IWalletProvider methods
    async createWallet() {
        try {
            const wallet = ethers_1.ethers.Wallet.createRandom();
            return {
                address: wallet.address,
                privateKey: wallet.privateKey
            };
        }
        catch (error) {
            throw (0, serviceErrors_1.handleServiceError)(error, 'blockchain');
        }
    }
    getAddressFromPrivateKey(privateKey) {
        try {
            const wallet = new ethers_1.ethers.Wallet(privateKey);
            return wallet.address;
        }
        catch (error) {
            throw (0, serviceErrors_1.handleServiceError)(error, 'blockchain');
        }
    }
    async signMessage(message, privateKey) {
        try {
            const wallet = new ethers_1.ethers.Wallet(privateKey);
            return await wallet.signMessage(message);
        }
        catch (error) {
            throw (0, serviceErrors_1.handleServiceError)(error, 'blockchain');
        }
    }
    async verifySignature(message, signature, address) {
        try {
            const signerAddress = ethers_1.ethers.verifyMessage(message, signature);
            return signerAddress.toLowerCase() === address.toLowerCase();
        }
        catch (error) {
            throw (0, serviceErrors_1.handleServiceError)(error, 'blockchain');
        }
    }
    // Helper methods
    async getTokenContract(cryptoType) {
        let tokenAddress;
        // Get token address based on crypto type
        switch (cryptoType.toUpperCase()) {
            case 'USDT':
                tokenAddress = env_1.config.blockchain.tokens.usdt;
                break;
            case 'USDC':
                tokenAddress = env_1.config.blockchain.tokens.usdc;
                break;
            default:
                throw new serviceErrors_1.BlockchainError(`Unsupported token type: ${cryptoType}`);
        }
        if (!tokenAddress) {
            throw new serviceErrors_1.BlockchainError(`Token address not configured for ${cryptoType}`);
        }
        // Use a more complete ABI that includes all the methods we need
        const contract = new ethers_1.ethers.Contract(tokenAddress, [
            'function balanceOf(address) view returns (uint256)',
            'function transfer(address, uint256) returns (bool)',
            'function decimals() view returns (uint8)',
            'function symbol() view returns (string)',
            'function approve(address, uint256) returns (bool)'
        ], this.companyWallet);
        // Use a two-step casting approach
        return contract;
    }
}
exports.EthereumProvider = EthereumProvider;
