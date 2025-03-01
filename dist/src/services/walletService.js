"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const env_1 = require("../../config/env");
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
}
exports.WalletService = WalletService;
//# sourceMappingURL=walletService.js.map