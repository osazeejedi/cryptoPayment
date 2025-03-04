"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const env_1 = require("../../config/env");
const axios_1 = __importDefault(require("axios"));
const ethers_1 = require("ethers");
const blockcypher_1 = require("../../config/blockcypher");
const databaseService_1 = require("./databaseService");
const blockchainService_1 = require("./blockchainService");
class WalletService {
    static async getUserWallet(userId, walletAddress, walletPrivateKey) {
        // Simply return the provided wallet information
        return {
            address: walletAddress,
            privateKey: walletPrivateKey
        };
    }
    static checkUserBalance(balance, amount) {
        // Check if user has enough balance for the transaction
        return parseFloat(balance) >= parseFloat(amount);
    }
    static getCompanyWallet() {
        return {
            address: env_1.config.blockchain.companyWallet.address,
            privateKey: env_1.config.blockchain.companyWallet.privateKey,
        };
    }
    /**
     * Generate a new Ethereum wallet
     * @returns Object containing address and private key
     */
    static async generateWallet() {
        try {
            // First try to use BlockCypher API
            const response = await axios_1.default.post('https://api.blockcypher.com/v1/eth/main/addrs', // Updated to use mainnet
            {}, {
                params: {
                    token: blockcypher_1.blockCypherConfig.token
                }
            });
            if (response.data && response.data.address && response.data.private) {
                return {
                    address: response.data.address,
                    privateKey: response.data.private
                };
            }
            throw new Error('Invalid response from BlockCypher');
        }
        catch (error) {
            console.log('BlockCypher wallet generation failed, falling back to ethers:', error);
            // Fallback to ethers.js if BlockCypher fails
            const wallet = ethers_1.ethers.Wallet.createRandom();
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
    static async createWalletForUser(userId, cryptoType, label) {
        try {
            // Check if user exists
            const user = await databaseService_1.DatabaseService.getUserById(userId);
            if (!user) {
                throw new Error('User not found');
            }
            // Generate a new wallet using BlockCypher
            const { address, privateKey } = await this.generateWallet();
            // Check if this is the first wallet for this crypto type
            const userWallets = await databaseService_1.DatabaseService.getUserWallets(userId);
            const isFirstOfType = !userWallets.some(w => w.crypto_type === cryptoType);
            // Create wallet in database
            const newWallet = await databaseService_1.DatabaseService.createWallet({
                user_id: userId,
                address,
                crypto_type: cryptoType,
                is_primary: isFirstOfType,
                label: label || `${cryptoType} Wallet`,
                private_key: privateKey // Note: In production, encrypt this or use a different approach
            });
            return newWallet;
        }
        catch (error) {
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
    static async getWalletBalance(address, cryptoType) {
        try {
            if (cryptoType !== 'ETH' && cryptoType !== 'USDT') {
                throw new Error(`Unsupported cryptocurrency: ${cryptoType}`);
            }
            if (cryptoType === 'ETH') {
                try {
                    // Try BlockCypher first
                    const response = await axios_1.default.get((0, blockcypher_1.getBlockCypherUrl)(`/addrs/${address}/balance`), {
                        params: {
                            token: blockcypher_1.blockCypherConfig.token
                        }
                    });
                    if (response.data && response.data.balance !== undefined) {
                        // BlockCypher returns balance in wei (satoshis for ETH)
                        const balanceInEth = ethers_1.ethers.formatEther(response.data.balance.toString());
                        return balanceInEth;
                    }
                }
                catch (blockCypherError) {
                    console.error('BlockCypher balance check failed, falling back to provider:', blockCypherError);
                }
            }
            // Fallback to our existing blockchain service
            return await blockchainService_1.BlockchainService.getWalletBalance(address, cryptoType);
        }
        catch (error) {
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
    static async getWalletTransactions(address, limit = 10) {
        try {
            const response = await axios_1.default.get((0, blockcypher_1.getBlockCypherUrl)(`/addrs/${address}`), {
                params: {
                    token: blockcypher_1.blockCypherConfig.token,
                    limit,
                    includeScript: false,
                    includeConfidence: false
                }
            });
            if (response.data && response.data.txrefs) {
                return response.data.txrefs.map((tx) => ({
                    hash: tx.tx_hash,
                    block_height: tx.block_height,
                    confirmed: tx.confirmed,
                    value: ethers_1.ethers.formatEther(tx.value.toString()),
                    spent: tx.spent,
                    confirmations: tx.confirmations
                }));
            }
            return [];
        }
        catch (error) {
            console.error('Error getting wallet transactions:', error);
            return [];
        }
    }
    /**
     * Verify a wallet address using BlockCypher
     * @param address Wallet address to verify
     * @returns Boolean indicating if address is valid
     */
    static async verifyAddress(address) {
        try {
            // First check using ethers.js
            if (!ethers_1.ethers.isAddress(address)) {
                return false;
            }
            // Then verify with BlockCypher
            try {
                const response = await axios_1.default.get((0, blockcypher_1.getBlockCypherUrl)(`/addrs/${address}`), {
                    params: {
                        token: blockcypher_1.blockCypherConfig.token
                    }
                });
                return !!response.data && !!response.data.address;
            }
            catch (error) {
                // If BlockCypher returns a 404, the address doesn't exist but might be valid
                if (error &&
                    typeof error === 'object' &&
                    'response' in error &&
                    error.response &&
                    typeof error.response === 'object' &&
                    'status' in error.response &&
                    error.response.status === 404) {
                    return true; // Address format is valid but not found on blockchain
                }
                console.error('BlockCypher address verification failed:', error);
                // Fall back to ethers.js validation only
                return ethers_1.ethers.isAddress(address);
            }
        }
        catch (error) {
            console.error('Error verifying address:', error);
            return false;
        }
    }
    static async checkWalletExistence(address) {
        try {
            // First check using ethers.js
            if (!ethers_1.ethers.isAddress(address)) {
                return false;
            }
            // Then verify with BlockCypher
            try {
                const response = await axios_1.default.get((0, blockcypher_1.getBlockCypherUrl)(`/addrs/${address}`), {
                    params: {
                        token: blockcypher_1.blockCypherConfig.token
                    }
                });
                return !!response.data && !!response.data.address;
            }
            catch (error) {
                console.error('Error checking wallet existence:', error);
                // Type guard to check if error is an object with response property
                if (error &&
                    typeof error === 'object' &&
                    'response' in error &&
                    error.response &&
                    typeof error.response === 'object' &&
                    'status' in error.response &&
                    error.response.status === 404) {
                    // Wallet doesn't exist, create it
                    return false;
                }
                throw new Error(`Failed to check wallet existence: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        catch (error) {
            console.error('Error checking wallet existence:', error);
            throw new Error(`Failed to check wallet existence: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
exports.WalletService = WalletService;
