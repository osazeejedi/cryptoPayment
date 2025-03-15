"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VirtualAccountService = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../../config/env");
const uuid_1 = require("uuid");
class VirtualAccountService {
    /**
     * Create a permanent virtual account for a user
     */
    static async createVirtualAccount(data) {
        try {
            // Validate BVN
            if (!data.bvn || data.bvn.length !== 11) {
                throw new Error('Valid BVN is required');
            }
            const reference = `VA-${(0, uuid_1.v4)()}`;
            const payload = {
                account_name: data.account_name,
                account_reference: reference,
                permanent: true, // Always create permanent accounts
                bank_code: data.bank_code,
                customer: {
                    name: data.customer_name,
                    email: data.customer_email
                },
                kyc: {
                    bvn: data.bvn
                }
            };
            console.log('Creating virtual account with payload:', JSON.stringify(payload, null, 2));
            const response = await axios_1.default.post(`${this.BASE_URL}/virtual-bank-account`, payload, {
                headers: {
                    'Authorization': `Bearer ${this.SECRET_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data.data;
        }
        catch (error) {
            console.error('Error creating virtual account:', error);
            if (axios_1.default.isAxiosError(error) && error.response) {
                console.error('Korapay API error:', error.response.data);
                throw new Error(`Failed to create virtual account: ${JSON.stringify(error.response.data)}`);
            }
            throw new Error('Failed to create virtual account');
        }
    }
    /**
     * Verify a virtual account transaction
     */
    static async verifyTransaction(reference) {
        try {
            const response = await axios_1.default.get(`${this.BASE_URL}/transactions/reference/${reference}`, {
                headers: {
                    'Authorization': `Bearer ${this.SECRET_KEY}`
                }
            });
            return response.data.data;
        }
        catch (error) {
            console.error('Error verifying transaction:', error);
            throw new Error('Failed to verify transaction');
        }
    }
    /**
     * Get payment details for a virtual account transaction
     */
    static async getPaymentDetails(reference) {
        try {
            const response = await axios_1.default.get(`${this.BASE_URL}/charges/${reference}`, {
                headers: {
                    'Authorization': `Bearer ${this.SECRET_KEY}`
                }
            });
            return response.data;
        }
        catch (error) {
            console.error('Error getting payment details:', error);
            if (axios_1.default.isAxiosError(error) && error.response) {
                throw new Error(`Failed to get payment details: ${JSON.stringify(error.response.data)}`);
            }
            throw new Error('Failed to get payment details');
        }
    }
    static getAccountMapping(accountReference) {
        return this.accountMappings[accountReference] || null;
    }
}
exports.VirtualAccountService = VirtualAccountService;
VirtualAccountService.BASE_URL = 'https://api.korapay.com/merchant/api/v1';
VirtualAccountService.SECRET_KEY = env_1.config.payment.korapay.secretKey;
VirtualAccountService.accountMappings = {
    'customer005': {
        crypto_type: 'ETH',
        wallet_address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
    },
    'customer006': {
        crypto_type: 'TRX',
        wallet_address: 'TJYeasTPa6gpEEfYqJFTAJmfUvHJPdQS1V' // Example Tron address
    },
    'customer007': {
        crypto_type: 'USDT_TRC20',
        wallet_address: 'TJYeasTPa6gpEEfYqJFTAJmfUvHJPdQS1V' // Example Tron address
    }
    // Add more mappings as needed
};
