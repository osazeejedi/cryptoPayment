export declare class PriceService {
    private static API_URL;
    private static priceCache;
    private static CACHE_TTL;
    /**
     * Converts a cryptocurrency amount to its equivalent in Naira
     * @param amount The amount of cryptocurrency
     * @param cryptoType The type of cryptocurrency (e.g., 'ETH', 'BTC')
     * @returns The equivalent value in Naira as a string
     */
    static convertCryptoToNaira(amount: string, cryptoType: string): Promise<string>;
    /**
     * Converts a Naira amount to its equivalent in cryptocurrency
     * @param nairaAmount The amount in Naira
     * @param cryptoType The type of cryptocurrency (e.g., 'ETH', 'BTC')
     * @returns The equivalent value in cryptocurrency as a string
     */
    static convertNairaToCrypto(nairaAmount: string, cryptoType: string): Promise<string>;
    /**
     * Gets the current price of a cryptocurrency in Naira
     * Uses caching to reduce API calls
     */
    private static getCryptoPrice;
    /**
     * Get current price for a cryptocurrency
     * @param cryptoType Type of cryptocurrency (ETH, BTC, etc.)
     * @returns Current price in fiat currency
     */
    static getCurrentPrice(cryptoType: string): Promise<number>;
}
