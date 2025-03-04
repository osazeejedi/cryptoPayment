"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const walletService_1 = require("../src/services/walletService");
async function testBlockCypher() {
    try {
        console.log('=== TESTING BLOCKCYPHER INTEGRATION ===');
        // Test wallet generation
        console.log('\nGenerating a new wallet...');
        const wallet = await walletService_1.WalletService.generateWallet();
        console.log('Generated wallet:', {
            address: wallet.address,
            privateKey: `${wallet.privateKey.substring(0, 6)}...${wallet.privateKey.substring(wallet.privateKey.length - 4)}`
        });
        // Test address verification
        console.log('\nVerifying the generated address...');
        const isValid = await walletService_1.WalletService.verifyAddress(wallet.address);
        console.log('Address is valid:', isValid);
        // Test with a known address that should have transactions
        const knownAddress = '0x00000000219ab540356cBB839Cbe05303d7705Fa'; // Ethereum 2.0 deposit contract
        // Test balance check
        console.log('\nChecking balance of a known address...');
        const balance = await walletService_1.WalletService.getWalletBalance(knownAddress, 'ETH');
        console.log('Balance:', balance, 'ETH');
        // Test transaction history
        console.log('\nGetting transaction history of a known address...');
        const transactions = await walletService_1.WalletService.getWalletTransactions(knownAddress, 5);
        console.log('Transactions:', transactions);
        console.log('\n=== BLOCKCYPHER TESTS COMPLETED ===');
    }
    catch (error) {
        console.error('Error testing BlockCypher:', error);
    }
}
testBlockCypher();
//# sourceMappingURL=test-blockcypher.js.map