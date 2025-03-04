"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const korapayService_1 = require("../src/services/korapayService");
const readline_1 = __importDefault(require("readline"));
const rl = readline_1.default.createInterface({
    input: process.stdin,
    output: process.stdout
});
async function testMobileMoneyDirect() {
    try {
        console.log('=== TESTING DIRECT MOBILE MONEY PAYMENT ===');
        // Get mobile number
        const mobileNumber = await new Promise(resolve => {
            rl.question('Enter mobile number (e.g., +2348012345678): ', answer => {
                resolve(answer.trim());
            });
        });
        if (!mobileNumber.startsWith('+')) {
            console.error('Invalid mobile number. Please provide a number with country code (e.g., +2348012345678).');
            rl.close();
            return;
        }
        // Get provider
        const provider = await new Promise(resolve => {
            rl.question('Enter mobile money provider (e.g., mtn, airtel): ', answer => {
                resolve(answer.trim().toLowerCase());
            });
        });
        if (!provider) {
            console.error('Invalid provider. Please provide a valid mobile money provider.');
            rl.close();
            return;
        }
        // Confirm payment
        const confirmation = await new Promise(resolve => {
            rl.question(`Confirm payment of 500 NGN using ${provider} mobile money for number ${mobileNumber}? (y/n): `, answer => {
                resolve(answer.trim().toLowerCase());
            });
        });
        if (confirmation !== 'y' && confirmation !== 'yes') {
            console.log('Payment cancelled.');
            rl.close();
            return;
        }
        console.log(`\nInitiating mobile money payment...`);
        const result = await korapayService_1.KorapayService.processMobileMoneyPayment('500', // 500 Naira
        'customer@example.com', 'Test Customer', mobileNumber, provider, '0.0001', // Crypto amount
        'ETH', '0x2A69d89043948999bD327413b7B4f91d47018873' // Test wallet address
        );
        console.log('\nMobile money payment initiated!');
        console.log('Reference:', result.reference);
        console.log('Status:', result.status);
        console.log('\nPlease check your mobile phone for payment instructions.');
        console.log('After completing the payment, run "npm run check:webhook-logs" to see if any webhooks were received.');
        rl.close();
    }
    catch (error) {
        console.error('Error testing mobile money payment:', error);
        rl.close();
    }
}
testMobileMoneyDirect();
//# sourceMappingURL=test-mobile-money-direct.js.map