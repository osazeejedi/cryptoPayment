"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const env_1 = require("../config/env");
async function checkTestnetBalance() {
    try {
        // Use Sepolia testnet
        const network = 'sepolia';
        const alchemyUrl = `https://eth-${network}.g.alchemy.com/v2/${env_1.config.blockchain.alchemyApiKey}`;
        const provider = new ethers_1.ethers.JsonRpcProvider(alchemyUrl);
        // Get company wallet address
        const walletAddress = env_1.config.blockchain.companyWallet.address;
        console.log('Checking company wallet balance on Sepolia testnet...');
        console.log('Company wallet address:', walletAddress);
        // Get balance
        const balance = await provider.getBalance(walletAddress);
        console.log('Balance:', ethers_1.ethers.formatEther(balance), 'ETH');
        // Check if balance is sufficient for testing
        if (ethers_1.ethers.formatEther(balance) === '0.0') {
            console.log('\nWARNING: Your company wallet has no ETH on Sepolia testnet.');
            console.log('You need to get some test ETH from a faucet:');
            console.log('1. Go to https://sepoliafaucet.com/');
            console.log('2. Connect your wallet or enter your address');
            console.log('3. Request test ETH');
            console.log('\nAfter getting test ETH, run this script again to verify your balance.');
        }
        else {
            console.log('\nYour company wallet has sufficient balance for testing.');
        }
    }
    catch (error) {
        console.error('Error checking testnet balance:', error);
    }
}
checkTestnetBalance();
//# sourceMappingURL=check-testnet-balance.js.map