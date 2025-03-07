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
            // Get price (either from cache or API)
            const priceInNaira = await this.getCryptoPrice(cryptoSymbol);
            // Calculate Naira value
            const nairaValue = (parseFloat(amount) * priceInNaira).toFixed(2);
            // Format with commas for thousands
            return nairaValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        }
        catch (error) {
            console.error('Error converting crypto to Naira:', error);
            throw new Error('Failed to convert cryptocurrency to Naira');
        }
    }
    /**
     * Converts a Naira amount to its equivalent in cryptocurrency
     * @param nairaAmount The amount in Naira
     * @param cryptoType The type of cryptocurrency (e.g., 'ETH', 'BTC')
     * @returns The equivalent value in cryptocurrency as a string
     */
    static async convertNairaToCrypto(nairaAmount, cryptoType) {
        try {
            const cryptoPrice = await this.getCryptoPrice(cryptoType);
            const cryptoAmount = (parseFloat(nairaAmount) / cryptoPrice).toFixed(8);
            return cryptoAmount;
        }
        catch (error) {
            console.error('Error converting Naira to crypto:', error);
            throw new Error('Failed to convert Naira to crypto');
        }
    }
    /**
     * Gets the current price of a cryptocurrency in Naira
     * Uses caching to reduce API calls
     */
    static async getCryptoPrice(cryptoSymbol) {
        const now = Date.now();
        const cacheKey = cryptoSymbol;
        // Check if we have a valid cached price
        if (this.priceCache[cacheKey] &&
            now - this.priceCache[cacheKey].timestamp < this.CACHE_TTL) {
            return this.priceCache[cacheKey].price;
        }
        // Fetch current price from API
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
        // Get the price and cache it
        const price = response.data.data[cryptoSymbol].quote.NGN.price;
        this.priceCache[cacheKey] = {
            price,
            timestamp: now
        };
        return price;
    }
}
exports.PriceService = PriceService;
PriceService.API_URL = 'https://pro-api.coinmarketcap.com/v1';
PriceService.priceCache = {};
PriceService.CACHE_TTL = 60 * 1000; // 1 minute cache
