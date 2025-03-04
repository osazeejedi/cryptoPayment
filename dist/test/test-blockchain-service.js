"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const blockchainService_1 = require("../src/services/blockchainService");
const ethers_1 = require("ethers");
const env_1 = require("../config/env");
async function testBlockchainService() {
    try {
        console.log('=== TESTING BLOCKCHAIN SERVICE ===');
        // Check if the wallet address is valid
        const testAddress = '0x2A69d89043948999bD327413b7B4f91d47018873';
        const isValid = blockchainService_1.BlockchainService.isValidAddress(testAddress);
        console.log('Is wallet address valid:', isValid);
        // Check company wallet
        console.log('Company wallet address:', env_1.config.blockchain.companyWallet.address);
        // Get provider
        const network = 'sepolia';
        const alchemyUrl = `https://eth-${network}.g.alchemy.com/v2/${env_1.config.blockchain.alchemyApiKey}`;
        const provider = new ethers_1.ethers.JsonRpcProvider(alchemyUrl);
        // Check network
        const networkInfo = await provider.getNetwork();
        console.log('Connected to network:', networkInfo.name);
        // Check company wallet balance
        const balance = await provider.getBalance(env_1.config.blockchain.companyWallet.address);
        console.log('Company wallet balance:', ethers_1.ethers.formatEther(balance), 'ETH');
        // Test a small transfer (0.0001 ETH)
        console.log('\nTesting a small transfer of 0.0001 ETH...');
        try {
            const txHash = await blockchainService_1.BlockchainService.transferCrypto(testAddress, '0.0001', 'ETH');
            console.log('Transfer successful!');
            console.log('Transaction hash:', txHash);
        }
        catch (transferError) {
            console.error('Transfer failed:', transferError);
        }
        console.log('\n=== BLOCKCHAIN SERVICE TEST COMPLETED ===');
    }
    catch (error) {
        console.error('Error testing blockchain service:', error);
    }
}
testBlockchainService();
//# sourceMappingURL=test-blockchain-service.js.map