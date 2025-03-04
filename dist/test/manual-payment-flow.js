"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const korapayService_1 = require("../src/services/korapayService");
const buyController_1 = require("../src/controllers/buyController");
async function testManualPaymentFlow() {
    try {
        console.log('=== TESTING MANUAL PAYMENT FLOW ===');
        // Step 1: Initialize checkout
        console.log('\n1. Initializing checkout...');
        const checkout = await korapayService_1.KorapayService.initializeCheckout('500', 'customer@example.com', 'Test Customer', '0.0001', 'ETH', '0x2A69d89043948999bD327413b7B4f91d47018873');
        console.log('Checkout initialized with reference:', checkout.reference);
        console.log('Checkout URL:', checkout.checkout_url);
        // Step 2: Simulate a successful payment (normally done via the checkout page)
        console.log('\n2. Simulating successful payment...');
        console.log('(In a real scenario, the user would complete payment on the checkout page)');
        // Step 3: Manually trigger the buy process
        console.log('\n3. Manually triggering buy process...');
        const buyRequest = {
            user_id: 'customer@example.com',
            amount: '0.0001',
            crypto_type: 'ETH',
            wallet_address: '0x2A69d89043948999bD327413b7B4f91d47018873'
        };
        console.log('Buy request:', JSON.stringify(buyRequest, null, 2));
        // Create mock request and response objects
        const mockReq = { body: buyRequest };
        let responseData = null;
        const mockRes = {
            status: (code) => ({
                json: (data) => {
                    console.log(`Response (${code}):`, JSON.stringify(data, null, 2));
                    responseData = data;
                }
            })
        };
        // Process the buy request
        await buyController_1.BuyController.buyRequest(mockReq, mockRes);
        console.log('\n4. Buy process completed');
        if (responseData && responseData.status === 'success') {
            console.log('Transaction hash:', responseData.data.transaction_hash);
        }
        console.log('=== MANUAL PAYMENT FLOW TEST COMPLETED ===');
    }
    catch (error) {
        console.error('Manual payment flow test failed:', error);
    }
}
testManualPaymentFlow();
//# sourceMappingURL=manual-payment-flow.js.map