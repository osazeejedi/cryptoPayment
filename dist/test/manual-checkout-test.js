"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const API_URL = 'http://localhost:3000/api';
// Test data for checkout
const TEST_CHECKOUT_DATA = {
    amount: "0.01",
    cryptoType: "ETH",
    walletAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    email: "customer@example.com",
    name: "Test Customer",
    paymentMethod: "card"
};
async function testCheckout() {
    console.log("Testing Payment Checkout...");
    try {
        const response = await axios_1.default.post(`${API_URL}/buy/initiate`, TEST_CHECKOUT_DATA);
        console.log('\n=== Checkout Response ===');
        console.log(JSON.stringify(response.data, null, 2));
        console.log('=========================\n');
        if (response.data.success && response.data.data.paymentUrl) {
            console.log('Checkout URL (open this in your browser to test payment):');
            console.log(response.data.data.paymentUrl);
            console.log('\nTransaction Reference:');
            console.log(response.data.data.reference);
        }
        return true;
    }
    catch (error) {
        console.error('Checkout Error:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
        else {
            console.error('Error message:', error.message);
        }
        return false;
    }
}
// Run test
testCheckout();
//# sourceMappingURL=manual-checkout-test.js.map