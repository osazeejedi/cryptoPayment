"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockchainService = void 0;
const blockchain_1 = require("../../config/blockchain");
const walletService_1 = require("./walletService");
class BlockchainService {
    static async transferCrypto(fromAddress, fromPrivateKey, toAddress, amount, cryptoType) {
        try {
            // Convert amount to Wei (for ETH)
            const amountInWei = blockchain_1.web3.utils.toWei(amount, 'ether');
            // Get the nonce for the from address
            const nonce = await blockchain_1.web3.eth.getTransactionCount(fromAddress, 'latest');
            // Get current gas price and increase it for faster transactions
            const currentGasPrice = await blockchain_1.web3.eth.getGasPrice();
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
            const signedTx = await blockchain_1.web3.eth.accounts.signTransaction(txObject, fromPrivateKey);
            if (!signedTx.rawTransaction) {
                throw new Error('Failed to sign transaction');
            }
            // Send the transaction
            const receipt = await blockchain_1.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
            // Return the transaction hash as a string
            return receipt.transactionHash.toString();
        }
        catch (error) {
            console.error('Error transferring crypto:', error);
            throw new Error('Failed to transfer cryptocurrency');
        }
    }
    static async processBuyRequest(userId, amount, cryptoType, nairaValue, userWalletAddress) {
        // Get company wallet
        const companyWallet = walletService_1.WalletService.getCompanyWallet();
        // Transfer crypto from company wallet to user wallet
        const txHash = await this.transferCrypto(companyWallet.address, companyWallet.privateKey, userWalletAddress, amount, cryptoType);
        return txHash;
    }
    static async processSellRequest(userId, amount, cryptoType, nairaValue, userWalletAddress, userWalletPrivateKey) {
        // Get company wallet
        const companyWallet = walletService_1.WalletService.getCompanyWallet();
        // Transfer crypto from user wallet to company wallet
        const txHash = await this.transferCrypto(userWalletAddress, userWalletPrivateKey, companyWallet.address, amount, cryptoType);
        return txHash;
    }
}
exports.BlockchainService = BlockchainService;
//# sourceMappingURL=blockchainService.js.map