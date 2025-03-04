"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const korapayService_1 = require("../src/services/korapayService");
const blockchainService_1 = require("../src/services/blockchainService");
const open_1 = __importDefault(require("open"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function testFullFlowWithDebug() {
    try {
        console.log('=== TESTING FULL PAYMENT FLOW WITH DEBUG ===');
        // Step 1: Check if the logs directory exists, create it if not
        const logDir = path_1.default.resolve(__dirname, '../logs');
        if (!fs_1.default.existsSync(logDir)) {
            fs_1.default.mkdirSync(logDir, { recursive: true });
        }
        // Step 2: Clear previous logs
        const logFile = path_1.default.join(logDir, 'webhook-debug.log');
        if (fs_1.default.existsSync(logFile)) {
            fs_1.default.writeFileSync(logFile, '');
            console.log('Cleared previous webhook logs.');
        }
        // Step 3: Initialize checkout
        console.log('\nInitializing checkout...');
        const checkout = await korapayService_1.KorapayService.initializeCheckout('500', // 500 Naira
        'customer@example.com', 'Test Customer', '0.0001', // Crypto amount
        'ETH', '0x2A69d89043948999bD327413b7B4f91d47018873' // Test wallet address
        );
        console.log('Checkout initialized with reference:', checkout.reference);
        console.log('Checkout URL:', checkout.checkout_url);
        // Step 4: Open the checkout URL in the default browser
        console.log('\nOpening checkout URL in browser...');
        await (0, open_1.default)(checkout.checkout_url);
        console.log('\nPlease complete the payment on the checkout page.');
        console.log('After payment, the system will check for webhook notifications.');
        // Step 5: Wait for user to complete payment
        console.log('\nWaiting for payment completion...');
        console.log('Press Ctrl+C to exit if you do not wish to complete the payment.');
        // Wait for 2 minutes, checking for webhook logs every 10 seconds
        for (let i = 0; i < 12; i++) {
            await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
            console.log(`\nChecking for webhook logs (attempt ${i + 1}/12)...`);
            if (fs_1.default.existsSync(logFile)) {
                const logs = fs_1.default.readFileSync(logFile, 'utf8');
                const logEntries = logs.split('---\n').filter(entry => entry.trim());
                if (logEntries.length > 0) {
                    console.log(`Found ${logEntries.length} log entries.`);
                    // Check if any of the logs contain a Korapay webhook
                    const korapayWebhooks = logEntries.filter(entry => {
                        try {
                            const logData = JSON.parse(entry);
                            return logData.headers['x-korapay-signature'] !== undefined;
                        }
                        catch {
                            return false;
                        }
                    });
                    if (korapayWebhooks.length > 0) {
                        console.log('\nFound Korapay webhook notifications!');
                        console.log(`Received ${korapayWebhooks.length} webhook notifications.`);
                        // Parse the most recent webhook
                        const latestWebhook = JSON.parse(korapayWebhooks[korapayWebhooks.length - 1]);
                        if (latestWebhook.body && latestWebhook.body.data) {
                            const webhookData = latestWebhook.body.data;
                            console.log('\nWebhook data:');
                            console.log('Reference:', webhookData.reference);
                            console.log('Status:', webhookData.status);
                            console.log('Amount:', webhookData.amount);
                            if (webhookData.metadata) {
                                console.log('\nMetadata:');
                                console.log('Crypto Amount:', webhookData.metadata.crypto_amount);
                                console.log('Crypto Type:', webhookData.metadata.crypto_type);
                                console.log('Wallet Address:', webhookData.metadata.wallet_address);
                                // Step 6: Manually trigger the blockchain transfer
                                if (webhookData.status === 'success') {
                                    console.log('\nPayment successful! Manually triggering blockchain transfer...');
                                    try {
                                        const txHash = await blockchainService_1.BlockchainService.transferCrypto(webhookData.metadata.wallet_address, webhookData.metadata.crypto_amount, webhookData.metadata.crypto_type);
                                        console.log('\nBlockchain transfer successful!');
                                        console.log('Transaction Hash:', txHash);
                                        console.log('\nFull payment flow test completed successfully!');
                                        return;
                                    }
                                    catch (transferError) {
                                        console.error('\nError during blockchain transfer:', transferError);
                                    }
                                }
                            }
                        }
                        break;
                    }
                }
            }
            console.log('No Korapay webhook notifications found yet. Waiting...');
        }
        console.log('\nTimeout reached. No webhook notifications received or payment not completed.');
        console.log('You can check the logs manually with "npm run check:webhook-logs".');
    }
    catch (error) {
        console.error('Error testing full payment flow:', error);
    }
}
testFullFlowWithDebug();
//# sourceMappingURL=test-full-flow-with-debug.js.map