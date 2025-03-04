"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const korapayService_1 = require("../src/services/korapayService");
async function testCheckoutDebugSimple() {
    try {
        console.log('=== TESTING CHECKOUT WITH DEBUG WEBHOOK (SIMPLE VERSION) ===');
        // Initialize checkout
        console.log('Initializing checkout...');
        const checkout = await korapayService_1.KorapayService.initializeCheckout('500', // 500 Naira
        'customer@example.com', 'Test Customer', '0.0001', // Crypto amount
        'ETH', '0x2A69d89043948999bD327413b7B4f91d47018873' // Test wallet address
        );
        console.log('Checkout initialized with reference:', checkout.reference);
        console.log('Checkout URL:', checkout.checkout_url);
        console.log('\nPlease manually open this URL in your browser to complete the payment:');
        console.log(checkout.checkout_url);
        console.log('\nAfter payment, check your server logs for webhook notifications.');
        console.log('You can also run "npm run check:webhook-logs" to see if any webhooks were received.');
    }
    catch (error) {
        console.error('Error testing checkout with debug:', error);
    }
}
testCheckoutDebugSimple();
//# sourceMappingURL=test-checkout-debug-simple.js.map