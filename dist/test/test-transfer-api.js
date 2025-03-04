"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const readline_1 = __importDefault(require("readline"));
const env_1 = require("../config/env");
const rl = readline_1.default.createInterface({
    input: process.stdin,
    output: process.stdout
});
async function testTransferApi() {
    try {
        console.log('=== TRANSFER API TEST ===');
        // Get API base URL
        const baseUrl = env_1.config.app.baseUrl || 'http://localhost:3000';
        console.log(`Using API base URL: ${baseUrl}`);
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
        // Get recipient address
        const recipientAddress = await new Promise(resolve => {
            rl.question('\nEnter recipient address (0x...): ', answer => {
                resolve(answer.trim());
            });
        });
        // Get amount to send
        const amount = await new Promise(resolve => {
            rl.question('\nEnter amount to send (ETH): ', answer => {
                resolve(answer.trim());
            });
        });
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            console.error('Invalid amount. Please enter a positive number.');
            rl.close();
            return;
        }
        // Confirm transaction
        const confirmation = await new Promise(resolve => {
            rl.question(`\nConfirm sending ${amount} ETH to ${recipientAddress}? (y/n): `, answer => {
                resolve(answer.trim().toLowerCase());
            });
        });
        if (confirmation !== 'y' && confirmation !== 'yes') {
            console.log('Transaction cancelled.');
            rl.close();
            return;
        }
        console.log('\nSending API request...');
        // Send the API request
        const response = await axios_1.default.post(`${baseUrl}/api/transfer/send`, {
            from_private_key: privateKey,
            to_address: recipientAddress,
            amount,
            crypto_type: 'ETH'
        });
        console.log('\nAPI Response:');
        console.log(JSON.stringify(response.data, null, 2));
        if (response.data.status === 'success') {
            console.log(`\nTransaction Hash: ${response.data.data.transaction_hash}`);
            console.log(`View on Etherscan: https://sepolia.etherscan.io/tx/${response.data.data.transaction_hash}`);
        }
        rl.close();
    }
    catch (error) {
        console.error('Error during transfer API test:');
        if (axios_1.default.isAxiosError(error) && error.response) {
            console.error('Status:', error.response.status);
            console.error('Response:', error.response.data);
        }
        else {
            console.error(error);
        }
        rl.close();
    }
}
testTransferApi();
//# sourceMappingURL=test-transfer-api.js.map