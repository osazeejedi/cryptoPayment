"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const http_1 = require("http");
const app_1 = __importDefault(require("../src/app"));
const testUtils_1 = require("./utils/testUtils");
describe('User Buy Flow', () => {
    let server;
    let API_URL;
    beforeAll(async () => {
        // Find an available port and start the server
        const port = await (0, testUtils_1.findAvailablePort)(3001);
        server = (0, http_1.createServer)(app_1.default).listen(port);
        API_URL = `http://localhost:${port}/api`;
    });
    afterAll(() => {
        // Close the server when tests are done
        if (server)
            server.close();
    });
    it('should allow a user to register and buy crypto', async () => {
        // Create test user data
        const testEmail = `test-${Date.now()}@example.com`;
        const testPassword = 'Password123!';
        const testName = 'Test User';
        // Step 1: Register a new user
        const registerResponse = await axios_1.default.post(`${API_URL}/auth/register`, {
            email: testEmail,
            password: testPassword,
            name: testName
        });
        expect(registerResponse.status).toBe(201);
        expect(registerResponse.data.success).toBe(true);
        // Step 2: Login to get auth token
        const loginResponse = await axios_1.default.post(`${API_URL}/auth/login`, {
            email: testEmail,
            password: testPassword
        });
        expect(loginResponse.status).toBe(200);
        expect(loginResponse.data.token).toBeDefined();
        const token = loginResponse.data.token;
        // Step 3: Initialize a crypto purchase
        const buyResponse = await axios_1.default.post(`${API_URL}/payment/checkout`, {
            naira_amount: "5000",
            crypto_type: "ETH",
            email: testEmail,
            name: testName,
            wallet_address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        expect(buyResponse.status).toBe(200);
        expect(buyResponse.data.data.checkout_url).toBeDefined();
        // We can't test the actual payment process in an automated test
        // But we can verify the checkout flow initiated correctly
    });
});
//# sourceMappingURL=user-buy-flow.test.js.map