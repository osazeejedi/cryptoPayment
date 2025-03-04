"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const http_1 = require("http");
const app_1 = __importDefault(require("../src/app"));
const testUtils_1 = require("./utils/testUtils");
describe('API Endpoints', () => {
    let server;
    let API_URL;
    beforeAll(async () => {
        // Find an available port and start the server
        const port = await (0, testUtils_1.findAvailablePort)(3002);
        server = (0, http_1.createServer)(app_1.default).listen(port);
        API_URL = `http://localhost:${port}/api`;
    });
    afterAll(() => {
        // Close the server when tests are done
        if (server)
            server.close();
    });
    describe('Price Endpoint', () => {
        it('should return the current price of a cryptocurrency', async () => {
            const response = await axios_1.default.get(`${API_URL}/price?crypto=ETH`);
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(response.data.data.price).toBeDefined();
            expect(typeof response.data.data.price).toBe('number');
        });
    });
    describe('Health Check Endpoint', () => {
        it('should return a 200 status for the health check', async () => {
            const response = await axios_1.default.get(`${API_URL}/health`);
            expect(response.status).toBe(200);
            expect(response.data.status).toBe('ok');
        });
    });
});
//# sourceMappingURL=endpoints.test.js.map