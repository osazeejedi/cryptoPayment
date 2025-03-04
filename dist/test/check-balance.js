"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const balanceService_1 = require("../src/services/balanceService");
const env_1 = require("../config/env");
async function checkBalance() {
    try {
        console.log('Checking company wallet balance...');
        console.log('Company wallet address:', env_1.config.blockchain.companyWallet.address);
        const balance = await balanceService_1.BalanceService.getBalance(env_1.config.blockchain.companyWallet.address);
        console.log('ETH Balance:', balance.eth);
        console.log('USD Value:', balance.usd_value);
    }
    catch (error) {
        console.error('Error checking balance:', error);
    }
}
checkBalance();
//# sourceMappingURL=check-balance.js.map