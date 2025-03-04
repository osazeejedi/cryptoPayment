export interface IBlockchainProvider {
    getBalance(address: string, cryptoType: string): Promise<string>;
    transferCrypto(to: string, amount: string, cryptoType: string): Promise<string>;
    verifyTransaction(txHash: string): Promise<boolean>;
    estimateGas(to: string, amount: string, cryptoType: string): Promise<string>;
}
export interface IERC20Provider {
    getBalance(tokenAddress: string, ownerAddress: string): Promise<string>;
    transfer(tokenAddress: string, to: string, amount: string): Promise<string>;
    approve(tokenAddress: string, spender: string, amount: string): Promise<string>;
}
export interface IWalletProvider {
    createWallet(): Promise<{
        address: string;
        privateKey: string;
    }>;
    getAddressFromPrivateKey(privateKey: string): string;
    signMessage(message: string, privateKey: string): Promise<string>;
    verifySignature(message: string, signature: string, address: string): Promise<boolean>;
}
