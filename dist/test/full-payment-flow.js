"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const korapayService_1 = require("../src/services/korapayService");
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../config/env");
const ethers_1 = require("ethers");
// Function to generate a webhook signature
function generateSignature(payload, secretKey) {
    const hmac = crypto_1.default.createHmac('sha512', secretKey);
    return hmac.update(payload).digest('hex');
}
async function testFullPaymentFlow() {
    try {
        console.log('=== TESTING FULL PAYMENT FLOW ===\n');
        // Step 1: Check company wallet balance
        console.log('Step 1: Checking company wallet balance...');
        const network = 'sepolia';
        const alchemyUrl = `https://eth-${network}.g.alchemy.com/v2/${env_1.config.blockchain.alchemyApiKey}`;
        const provider = new ethers_1.ethers.JsonRpcProvider(alchemyUrl);
        const walletAddress = env_1.config.blockchain.companyWallet.address;
        const balance = await provider.getBalance(walletAddress);
        console.log('Company wallet address:', walletAddress);
        console.log('Balance:', ethers_1.ethers.formatEther(balance), 'ETH');
        if (ethers_1.ethers.formatEther(balance) === '0.0') {
            console.error('ERROR: Your company wallet has no ETH on Sepolia testnet.');
            console.log('Please get some test ETH from a faucet before continuing.');
            return;
        }
        console.log('Company wallet has sufficient balance.\n');
        // Step 2: Initialize checkout
        console.log('Step 2: Initializing checkout...');
        const checkout = await korapayService_1.KorapayService.initializeCheckout('500', 'customer@example.com', 'Test Customer', '0.0001', 'ETH', '0x2A69d89043948999bD327413b7B4f91d47018873');
        console.log('Checkout initialized with reference:', checkout.reference);
        console.log('Checkout URL:', checkout.checkout_url);
        console.log('\nNormally, the user would complete payment on the checkout page.');
        console.log('For testing, we will simulate a successful payment webhook.\n');
        // Step 3: Simulate webhook
        console.log('Step 3: Simulating webhook...');
        // Create webhook payload
        const payload = {
            event: 'charge.completed',
            data: {
                reference: checkout.reference,
                status: 'success',
                amount: '500',
                currency: 'NGN',
                customer: {
                    name: 'Test Customer',
                    email: 'customer@example.com'
                },
                metadata: {
                    crypto_amount: '0.0001',
                    crypto_type: 'ETH',
                    wallet_address: '0x2A69d89043948999bD327413b7B4f91d47018873'
                },
                payment_method: 'card',
                paid_at: new Date().toISOString()
            }
        };
        // Convert payload to string
        const payloadString = JSON.stringify(payload);
        // Generate signature
        const signature = generateSignature(payloadString, env_1.config.payment.korapay.secretKey);
        console.log('Sending webhook to server...');
        // Send webhook to your local server
        const webhookUrl = 'http://localhost:3000/api/payment/webhook';
        const response = await axios_1.default.post(webhookUrl, payload, {
            headers: {
                'Content-Type': 'application/json',
                'X-Korapay-Signature': signature
            }
        });
        console.log('Webhook response:', response.status, response.data);
        // Step 4: Verify the transaction
        console.log('\nStep 4: Waiting for transaction to be mined...');
        console.log('This may take a few minutes on the testnet.');
        // Wait for 30 seconds to allow the transaction to be mined
        await new Promise(resolve => setTimeout(resolve, 30000));
        // Check the recipient's balance
        const recipientBalance = await provider.getBalance('0x2A69d89043948999bD327413b7B4f91d47018873');
        console.log('Recipient balance:', ethers_1.ethers.formatEther(recipientBalance), 'ETH');
        console.log('\n=== FULL PAYMENT FLOW TEST COMPLETED ===');
    }
    catch (error) {
        console.error('Full payment flow test failed:', error);
    }
}
testFullPaymentFlow();
//# sourceMappingURL=full-payment-flow.js.map