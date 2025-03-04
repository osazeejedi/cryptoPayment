"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
async function testKorapayConnection() {
    try {
        console.log('Testing Korapay API connection...');
        console.log('Using secret key:', env_1.config.payment.korapay.secretKey.substring(0, 10) + '...');
        // Try with Bearer token format
        console.log('Attempting with Bearer token format...');
        try {
            const response = await axios_1.default.get('https://api.korapay.com/merchant/api/v1/misc/banks', {
                headers: {
                    'Authorization': `Bearer ${env_1.config.payment.korapay.secretKey}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('Connection successful with Bearer token!');
            console.log('Response status:', response.status);
            console.log('Response data:', JSON.stringify(response.data, null, 2));
            return;
        }
        catch (error) {
            console.error('Bearer token attempt failed');
            if (axios_1.default.isAxiosError(error)) {
                console.error('Status:', error.response?.status);
                console.error('Data:', error.response?.data);
            }
        }
        // Try with just the token (no Bearer prefix)
        console.log('\nAttempting with just the token (no Bearer prefix)...');
        try {
            const response = await axios_1.default.get('https://api.korapay.com/merchant/api/v1/misc/banks', {
                headers: {
                    'Authorization': env_1.config.payment.korapay.secretKey,
                    'Content-Type': 'application/json'
                }
            });
            console.log('Connection successful with just the token!');
            console.log('Response status:', response.status);
            console.log('Response data:', JSON.stringify(response.data, null, 2));
            return;
        }
        catch (error) {
            console.error('Just token attempt failed');
            if (axios_1.default.isAxiosError(error)) {
                console.error('Status:', error.response?.status);
                console.error('Data:', error.response?.data);
            }
        }
        // Try with Basic auth
        console.log('\nAttempting with Basic auth...');
        try {
            const response = await axios_1.default.get('https://api.korapay.com/merchant/api/v1/misc/banks', {
                headers: {
                    'Authorization': `Basic ${Buffer.from(env_1.config.payment.korapay.secretKey + ':').toString('base64')}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('Connection successful with Basic auth!');
            console.log('Response status:', response.status);
            console.log('Response data:', JSON.stringify(response.data, null, 2));
            return;
        }
        catch (error) {
            console.error('Basic auth attempt failed');
            if (axios_1.default.isAxiosError(error)) {
                console.error('Status:', error.response?.status);
                console.error('Data:', error.response?.data);
            }
        }
        // Add this to your test function
        console.log('\nAttempting with test environment URL...');
        try {
            const response = await axios_1.default.get('https://api-test.korapay.com/merchant/api/v1/misc/banks', {
                headers: {
                    'Authorization': `Bearer ${env_1.config.payment.korapay.secretKey}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('Connection successful with test environment URL!');
            console.log('Response status:', response.status);
            console.log('Response data:', JSON.stringify(response.data, null, 2));
            return;
        }
        catch (error) {
            console.error('Test environment URL attempt failed');
            if (axios_1.default.isAxiosError(error)) {
                console.error('Status:', error.response?.status);
                console.error('Data:', error.response?.data);
            }
        }
        // Add this to your test function
        console.log('\nAttempting with alternative key (no quotes)...');
        try {
            const altKey = process.env.KORAPAY_SECRET_KEY_ALT;
            console.log('Using alt key:', altKey?.substring(0, 10) + '...');
            const response = await axios_1.default.get('https://api.korapay.com/merchant/api/v1/misc/banks', {
                headers: {
                    'Authorization': `Bearer ${altKey}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('Connection successful with alternative key!');
            console.log('Response status:', response.status);
            console.log('Response data:', JSON.stringify(response.data, null, 2));
            return;
        }
        catch (error) {
            console.error('Alternative key attempt failed');
            if (axios_1.default.isAxiosError(error)) {
                console.error('Status:', error.response?.status);
                console.error('Data:', error.response?.data);
            }
        }
        // Add this to your test function based on documentation
        console.log('\nAttempting with method from documentation...');
        try {
            // This is a placeholder - replace with the actual method from documentation
            const response = await axios_1.default.get('https://api.korapay.com/merchant/api/v1/misc/banks', {
                headers: {
                    'Authorization': `Bearer ${env_1.config.payment.korapay.secretKey}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('Connection successful with documentation method!');
            console.log('Response status:', response.status);
            console.log('Response data:', JSON.stringify(response.data, null, 2));
            return;
        }
        catch (error) {
            console.error('Documentation method attempt failed');
            if (axios_1.default.isAxiosError(error)) {
                console.error('Status:', error.response?.status);
                console.error('Data:', error.response?.data);
            }
        }
        // Add this to your test function
        console.log('\nAttempting with public key...');
        try {
            const response = await axios_1.default.get('https://api.korapay.com/merchant/api/v1/misc/banks', {
                headers: {
                    'Authorization': `Bearer ${env_1.config.payment.korapay.publicKey}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('Connection successful with public key!');
            console.log('Response status:', response.status);
            console.log('Response data:', JSON.stringify(response.data, null, 2));
            return;
        }
        catch (error) {
            console.error('Public key attempt failed');
            if (axios_1.default.isAxiosError(error)) {
                console.error('Status:', error.response?.status);
                console.error('Data:', error.response?.data);
            }
        }
        console.error('All authentication attempts failed');
    }
    catch (error) {
        console.error('Connection failed!');
        if (axios_1.default.isAxiosError(error)) {
            console.error('Status:', error.response?.status);
            console.error('Data:', error.response?.data);
            console.error('Message:', error.message);
        }
        else {
            console.error('Error:', error);
        }
    }
}
testKorapayConnection();
//# sourceMappingURL=korapay-connection.test.js.map