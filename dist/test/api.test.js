"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const API_URL = 'http://localhost:3000/api';
async function testBuyRequest() {
    try {
        const response = await axios_1.default.post(`${API_URL}/buy`, {
            user_id: "test_user_1",
            amount: "0.0001",
            crypto_type: "ETH",
            wallet_address: "0x2A69d89043948999bD327413b7B4f91d47018873"
        });
        console.log('Buy Request Response:', response.data);
        return response.data;
    }
    catch (error) {
        console.error('Buy Request Error:', error.response?.data || error.message);
    }
}
async function testSellRequest() {
    try {
        const response = await axios_1.default.post(`${API_URL}/sell`, {
            user_id: "test_user_1",
            amount: "0.0001",
            crypto_type: "ETH",
            wallet_address: "0x2A69d89043948999bD327413b7B4f91d47018873",
            wallet_private_key: "ce81f1cdf3183fd9d6b205ae9e72feaa3928eb022de20a1e5a2b4a856641f390",
            balance: "0.009"
        });
        console.log('Sell Request Response:', response.data);
        return response.data;
    }
    catch (error) {
        console.error('Sell Request Error:', error.response?.data || error.message);
    }
}
// Run tests
async function runTests() {
    console.log('Testing Buy Request...');
    await testBuyRequest();
    console.log('\nTesting Sell Request...');
    await testSellRequest();
}
runTests();
//# sourceMappingURL=api.test.js.map