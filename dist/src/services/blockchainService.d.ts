import { ethers } from 'ethers';
interface IERC20Contract extends ethers.BaseContract {
    transfer(to: string, amount: bigint, overrides?: any): Promise<any>;
    balanceOf(owner: string): Promise<bigint>;
    decimals(): Promise<number>;
    symbol(): Promise<string>;
    approve(spender: string, amount: bigint): Promise<any>;
    estimateGas: {
        transfer(to: string, amount: bigint): Promise<bigint>;
    };
}
export declare class BlockchainService {
    private static provider;
    static initialize(): void;
    static getBalance(address: string, cryptoType?: string): Promise<string>;
    static verifyTransaction(txHash: string, cryptoType: string): Promise<boolean>;
    static estimateGas(to: string, amount: string, cryptoType?: string): Promise<string>;
    private static readonly COMPANY_WALLET_PRIVATE_KEY;
    private static readonly COMPANY_WALLET_ADDRESS;
    private static readonly USDT_CONTRACT_ADDRESS;
    private static readonly ERC20_ABI;
    private static readonly UNISWAP_ROUTER_ADDRESS;
    private static readonly WETH_ADDRESS;
    private static readonly UNISWAP_ROUTER_ABI;
    static getEthersProvider(cryptoType: string): ethers.JsonRpcProvider;
    static isValidAddress(address: string, cryptoType: string): Promise<boolean>;
    static transferCrypto(toAddress: string, amount: string, cryptoType: string): Promise<string>;
    static processBuyRequest(userId: string, amount: string, cryptoType: string, nairaValue: string, userWalletAddress: string): Promise<string>;
    static processSellRequest(userId: string, amount: string, cryptoType: string, nairaValue: string, userWalletAddress: string, userWalletPrivateKey: string): Promise<string>;
    /**
     * Send cryptocurrency to a specified address
     * @param fromPrivateKey Private key of the sender's wallet
     * @param toAddress Recipient's wallet address
     * @param amount Amount of crypto to send
     * @param cryptoType Type of cryptocurrency (ETH, USDT, etc.)
     * @returns Transaction hash
     */
    static sendCrypto(fromPrivateKey: string, toAddress: string, amount: string, cryptoType: string): Promise<string>;
    /**
     * Get the wallet address from a private key
     * @param privateKey Private key
     * @returns Wallet address
     */
    static getAddressFromPrivateKey(privateKey: string): string;
    /**
     * Validate a blockchain transaction
     * @param transactionHash Transaction hash to validate
     * @param walletAddress Expected wallet address
     * @param amount Expected amount
     * @param cryptoType Type of cryptocurrency
     * @returns True if transaction is valid
     */
    static validateTransaction(transactionHash: string, walletAddress: string, amount: string, cryptoType: string): Promise<boolean>;
    /**
     * Get the contract for a token
     * @param tokenType Token type (e.g., 'USDT')
     * @returns Contract instance
     */
    static getTokenContract(tokenType: string): IERC20Contract;
    /**
     * Get token decimals
     * @param tokenType Token type (e.g., 'USDT')
     * @returns Number of decimals
     */
    static getTokenDecimals(tokenType: string): Promise<number>;
    /**
     * Swap ETH for USDT or USDT for ETH
     * @param privateKey Private key of the wallet
     * @param amount Amount to swap
     * @param fromCrypto Source cryptocurrency (ETH or USDT)
     * @param toCrypto Target cryptocurrency (ETH or USDT)
     * @param slippagePercentage Maximum acceptable slippage (e.g., 0.5 for 0.5%)
     * @returns Transaction hash
     */
    static swapCrypto(privateKey: string, amount: string, fromCrypto: string, toCrypto: string, slippagePercentage?: number): Promise<string>;
    /**
     * Get estimated swap output amount
     * @param amount Amount to swap
     * @param fromCrypto Source cryptocurrency
     * @param toCrypto Target cryptocurrency
     * @returns Estimated output amount
     */
    static getSwapEstimate(amount: string, fromCrypto: string, toCrypto: string): Promise<string>;
    /**
     * Get wallet balance
     * @param address Wallet address
     * @param cryptoType Cryptocurrency type
     * @returns Balance as string
     */
    static getWalletBalance(address: string, cryptoType: string): Promise<string>;
    /**
     * Transfer crypto from user wallet to company wallet
     * @param privateKey User's private key
     * @param amount Amount to transfer
     * @param cryptoType Cryptocurrency type
     * @returns Transaction hash
     */
    static transferFromUserToCompany(privateKey: string, amount: string, cryptoType: string): Promise<string>;
}
export declare const blockchainService: BlockchainService;
export {};
