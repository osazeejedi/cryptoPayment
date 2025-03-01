export declare class PriceService {
    private static API_URL;
    /**
     * Converts a cryptocurrency amount to its equivalent in Naira
     * @param amount The amount of cryptocurrency
     * @param cryptoType The type of cryptocurrency (e.g., 'ETH', 'BTC')
     * @returns The equivalent value in Naira as a string
     */
    static convertCryptoToNaira(amount: string, cryptoType: string): Promise<string>;
}
