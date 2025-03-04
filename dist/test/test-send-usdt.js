"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const blockchainService_1 = require("../src/services/blockchainService");
const balanceService_1 = require("../src/services/balanceService");
const readline_1 = __importDefault(require("readline"));
const rl = readline_1.default.createInterface({
    input: process.stdin,
    output: process.stdout
});
async function testSendUsdt() {
    try {
        console.log('=== SEND USDT TEST ===');
        // Get sender's private key
        const privateKey = await new Promise(resolve => {
            rl.question('Enter your private key (0x...): ', answer => {
                resolve(answer.trim());
            });
        });
        if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
            console.error('Invalid private key format. It should start with 0x and be 66 characters long.');
            rl.close();
            return;
        }
        // Get sender's address from private key
        let senderAddress;
        try {
            senderAddress = blockchainService_1.BlockchainService.getAddressFromPrivateKey(privateKey);
            console.log(`\nSender's address: ${senderAddress}`);
        }
        catch (error) {
            console.error('Error getting address from private key:', error);
            rl.close();
            return;
        }
        // Check sender's USDT balance
        console.log('\nChecking sender\'s USDT balance...');
        const balance = await balanceService_1.BalanceService.getWalletBalance(senderAddress, 'USDT');
        console.log(`USDT Balance: ${balance}`);
        if (parseFloat(balance) <= 0) {
            console.error('Insufficient USDT balance. Please fund your wallet first.');
            rl.close();
            return;
        }
        // Get recipient address
        const recipientAddress = await new Promise(resolve => {
            rl.question('\nEnter recipient address (0x...): ', answer => {
                resolve(answer.trim());
            });
        });
        if (!blockchainService_1.BlockchainService.isValidAddress(recipientAddress, 'USDT')) {
            console.error('Invalid ETH address.');
            rl.close();
            return;
        }
        // Get amount to send
        const amount = await new Promise(resolve => {
            rl.question(`\nEnter amount to send (max ${balance} USDT): `, answer => {
                resolve(answer.trim());
            });
        });
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0 || numAmount > parseFloat(balance)) {
            console.error('Invalid amount. Please enter a positive number not exceeding your balance.');
            rl.close();
            return;
        }
        // Check if sender has enough ETH for gas
        console.log('\nChecking ETH balance for gas...');
        const ethBalance = await balanceService_1.BalanceService.getWalletBalance(senderAddress, 'ETH');
        console.log(`ETH Balance: ${ethBalance}`);
        if (parseFloat(ethBalance) <= 0.001) {
            console.warn('Warning: Low ETH balance for gas fees. Transaction might fail.');
        }
        // Confirm transaction
        const confirmation = await new Promise(resolve => {
            rl.question(`\nConfirm sending ${amount} USDT to ${recipientAddress}? (y/n): `, answer => {
                resolve(answer.trim().toLowerCase());
            });
        });
        if (confirmation !== 'y' && confirmation !== 'yes') {
            console.log('Transaction cancelled.');
            rl.close();
            return;
        }
        console.log('\nSending transaction...');
        // Send the transaction
        const txHash = await blockchainService_1.BlockchainService.sendCrypto(privateKey, recipientAddress, amount, 'USDT');
        console.log('\nTransaction sent successfully!');
        console.log('Transaction Hash:', txHash);
        console.log(`View on Etherscan: https://sepolia.etherscan.io/tx/${txHash}`);
        // Check new balance after a few seconds
        console.log('\nWaiting 10 seconds to check new balance...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        const newBalance = await balanceService_1.BalanceService.getWalletBalance(senderAddress, 'USDT');
        console.log(`\nNew USDT balance: ${newBalance}`);
        rl.close();
    }
    catch (error) {
        console.error('Error during send USDT test:', error);
        rl.close();
    }
}
testSendUsdt();
//# sourceMappingURL=test-send-usdt.js.map