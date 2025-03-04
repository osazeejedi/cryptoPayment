"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const korapayService_1 = require("../src/services/korapayService");
const open_1 = __importDefault(require("open"));
async function testCheckoutWithDebug() {
    try {
        console.log('=== TESTING CHECKOUT WITH DEBUG WEBHOOK ===');
        // Initialize checkout
        console.log('Initializing checkout...');
        const checkout = await korapayService_1.KorapayService.initializeCheckout('500', // 500 Naira
        'customer@example.com', 'Test Customer', '0.0001', // Crypto amount
        'ETH', '0x2A69d89043948999bD327413b7B4f91d47018873' // Test wallet address
        );
        console.log('Checkout initialized with reference:', checkout.reference);
        console.log('Checkout URL:', checkout.checkout_url);
        // Open the checkout URL in the default browser
        console.log('Opening checkout URL in browser...');
        await (0, open_1.default)(checkout.checkout_url);
        console.log('\nPlease complete the payment on the checkout page.');
        console.log('After payment, check your server logs for webhook notifications.');
        console.log('Also check the logs/webhook-debug.log file for any incoming requests.');
    }
    catch (error) {
        console.error('Error testing checkout with debug:', error);
    }
}
testCheckoutWithDebug();
//# sourceMappingURL=test-checkout-with-debug.js.map