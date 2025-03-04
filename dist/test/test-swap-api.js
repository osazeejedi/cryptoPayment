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
async function testSwapApi() {
    try {
        console.log('=== SWAP API TEST ===');
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
        // Get swap direction
        const swapDirection = await new Promise(resolve => {
            rl.question('\nSwap direction (1 for ETH->USDT, 2 for USDT->ETH): ', answer => {
                resolve(answer.trim());
            });
        });
        let fromCrypto;
        let toCrypto;
        if (swapDirection === '1') {
            fromCrypto = 'ETH';
            toCrypto = 'USDT';
        }
        else if (swapDirection === '2') {
            fromCrypto = 'USDT';
            toCrypto = 'ETH';
        }
        else {
            console.error('Invalid swap direction. Please enter 1 or 2.');
            rl.close();
            return;
        }
        // Get amount to swap
        const amount = await new Promise(resolve => {
            rl.question(`\nEnter amount to swap (${fromCrypto}): `, answer => {
                resolve(answer.trim());
            });
        });
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            console.error('Invalid amount. Please enter a positive number.');
            rl.close();
            return;
        }
        // Get swap estimate
        console.log('\nGetting swap estimate...');
        const estimateResponse = await axios_1.default.get(`${baseUrl}/api/swap/estimate`, {
            params: {
                amount,
                from_crypto: fromCrypto,
                to_crypto: toCrypto
            }
        });
        console.log('Estimate Response:');
        console.log(JSON.stringify(estimateResponse.data, null, 2));
        const estimatedOutput = estimateResponse.data.data.estimated_output;
        console.log(`\nEstimated output: ${estimatedOutput} ${toCrypto}`);
        // Confirm swap
        const confirmation = await new Promise(resolve => {
            rl.question(`\nConfirm swapping ${amount} ${fromCrypto} for approximately ${estimatedOutput} ${toCrypto}? (y/n): `, answer => {
                resolve(answer.trim().toLowerCase());
            });
        });
        if (confirmation !== 'y' && confirmation !== 'yes') {
            console.log('Swap cancelled.');
            rl.close();
            return;
        }
        console.log('\nExecuting swap via API...');
        // Execute the swap
        const swapResponse = await axios_1.default.post(`${baseUrl}/api/swap/execute`, {
            private_key: privateKey,
            amount,
            from_crypto: fromCrypto,
            to_crypto: toCrypto,
            slippage_percentage: 0.5
        });
        console.log('\nSwap API Response:');
        console.log(JSON.stringify(swapResponse.data, null, 2));
        if (swapResponse.data.status === 'success') {
            console.log(`\nTransaction Hash: ${swapResponse.data.data.transaction_hash}`);
            console.log(`View on Etherscan: https://sepolia.etherscan.io/tx/${swapResponse.data.data.transaction_hash}`);
        }
        rl.close();
    }
    catch (error) {
        console.error('Error during swap API test:');
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
testSwapApi();
//# sourceMappingURL=test-swap-api.js.map