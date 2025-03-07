"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceController = void 0;
const priceService_1 = require("../services/priceService");
class PriceController {
    static async getPrice(req, res) {
        try {
            const { crypto_type, amount } = req.query;
            // Validate request
            if (!crypto_type) {
                res.status(400).json({ status: 'error', message: 'Missing crypto_type parameter' });
                return;
            }
            // If amount is provided, convert to Naira
            if (amount) {
                const nairaValue = await priceService_1.PriceService.convertCryptoToNaira(amount.toString(), crypto_type.toString());
                res.status(200).json({
                    status: 'success',
                    crypto_type: crypto_type.toString().toUpperCase(),
                    amount: amount.toString(),
                    naira_value: nairaValue,
                    timestamp: new Date().toISOString()
                });
                return;
            }
            // Otherwise just get the current price per unit
            const nairaValue = await priceService_1.PriceService.convertCryptoToNaira('1', crypto_type.toString());
            res.status(200).json({
                status: 'success',
                crypto_type: crypto_type.toString().toUpperCase(),
                price_per_unit: nairaValue,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('Price fetch error:', error);
            res.status(500).json({
                status: 'error',
                message: error instanceof Error ? error.message : 'An unknown error occurred'
            });
        }
    }
    static async convertNairaToCrypto(req, res) {
        try {
            const { naira_amount, crypto_type } = req.query;
            // Validate request
            if (!naira_amount || !crypto_type) {
                res.status(400).json({
                    status: 'error',
                    message: 'Missing required parameters: naira_amount and crypto_type'
                });
                return;
            }
            // Convert Naira to crypto
            const cryptoAmount = await priceService_1.PriceService.convertNairaToCrypto(naira_amount.toString(), crypto_type.toString());
            res.status(200).json({
                status: 'success',
                naira_amount: naira_amount.toString(),
                crypto_type: crypto_type.toString().toUpperCase(),
                crypto_amount: cryptoAmount,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('Conversion error:', error);
            res.status(500).json({
                status: 'error',
                message: error instanceof Error ? error.message : 'An unknown error occurred'
            });
        }
    }
    static async getCurrentPrice(req, res) {
        try {
            const crypto = req.query.crypto;
            if (!crypto) {
                res.status(400).json({ status: 'error', message: 'Crypto parameter is required' });
                return;
            }
            const price = await priceService_1.PriceService.getCurrentPrice(crypto);
            res.status(200).json({ status: 'success', data: { crypto, price } });
        }
        catch (error) {
            console.error('Error fetching price:', error);
            res.status(500).json({ status: 'error', message: 'Failed to fetch price' });
        }
    }
}
exports.PriceController = PriceController;
