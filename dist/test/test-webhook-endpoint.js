"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../config/env");
async function testWebhookEndpoint() {
    try {
        // Create a test payload
        const payload = {
            event: 'charge.completed',
            data: {
                reference: `TEST-${Date.now()}`,
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
        const hmac = crypto_1.default.createHmac('sha512', env_1.config.payment.korapay.secretKey);
        const signature = hmac.update(payloadString).digest('hex');
        // Send to your webhook endpoint
        console.log('Testing webhook endpoint...');
        console.log('Using secret key:', env_1.config.payment.korapay.secretKey);
        console.log('Payload:', payloadString);
        console.log('Generated signature:', signature);
        const response = await axios_1.default.post('http://localhost:3000/api/payment/webhook', payload, {
            headers: {
                'Content-Type': 'application/json',
                'X-Korapay-Signature': signature
            }
        });
        console.log('Response status:', response.status);
        console.log('Response data:', response.data);
    }
    catch (error) {
        console.error('Webhook test failed:');
        if (axios_1.default.isAxiosError(error)) {
            console.error('Status:', error.response?.status);
            console.error('Data:', error.response?.data);
        }
        else {
            console.error('Error:', error);
        }
    }
}
testWebhookEndpoint();
//# sourceMappingURL=test-webhook-endpoint.js.map