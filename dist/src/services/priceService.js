"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceService = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../../config/env");
class PriceService {
    /**
     * Converts a cryptocurrency amount to its equivalent in Naira
     * @param amount The amount of cryptocurrency
     * @param cryptoType The type of cryptocurrency (e.g., 'ETH', 'BTC')
     * @returns The equivalent value in Naira as a string
     */
    static async convertCryptoToNaira(amount, cryptoType) {
        try {
            // Map crypto types to CoinMarketCap symbols
            const cryptoSymbol = cryptoType.toUpperCase();
            // Fetch current price in USD
            const response = await axios_1.default.get(`${this.API_URL}/cryptocurrency/quotes/latest`, {
                headers: {
                    'X-CMC_PRO_API_KEY': env_1.config.api.coinmarketcapApiKey
                },
                params: {
                    symbol: cryptoSymbol,
                    convert: 'NGN'
                }
            });
            if (!response.data || !response.data.data || !response.data.data[cryptoSymbol]) {
                throw new Error('Failed to fetch cryptocurrency price');
            }
            // Calculate Naira value
            const priceInNaira = response.data.data[cryptoSymbol].quote.NGN.price;
            const nairaValue = (parseFloat(amount) * priceInNaira).toFixed(2);
            // Format with commas for thousands
            return nairaValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        }
        catch (error) {
            console.error('Error converting crypto to Naira:', error);
            throw new Error('Failed to convert cryptocurrency to Naira');
        }
    }
}
exports.PriceService = PriceService;
PriceService.API_URL = 'https://pro-api.coinmarketcap.com/v1';
//# sourceMappingURL=priceService.js.map