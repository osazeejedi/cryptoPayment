export declare class BalanceService {
    /**
     * Get ETH balance for a wallet address
     * @param walletAddress The Ethereum wallet address
     * @returns The balance in ETH as a string
     */
    static getEthBalance(walletAddress: string): Promise<string>;
    /**
     * Get ERC20 token balance for a wallet address
     * @param walletAddress The Ethereum wallet address
     * @param tokenContractAddress The token contract address
     * @returns The token balance as a string
     */
    static getTokenBalance(walletAddress: string, tokenContractAddress: string): Promise<string>;
    /**
     * Check if a wallet has sufficient ETH balance
     * @param walletAddress The wallet address to check
     * @param requiredAmount The amount of ETH required
     * @returns Boolean indicating if the wallet has sufficient balance
     */
    static hasSufficientEthBalance(walletAddress: string, requiredAmount: string): Promise<boolean>;
}
