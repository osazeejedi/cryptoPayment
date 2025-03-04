import { IBlockchainProvider, IERC20Provider, IWalletProvider } from '../../interfaces/blockchain';
export declare class EthereumProvider implements IBlockchainProvider, IERC20Provider, IWalletProvider {
    private provider;
    private companyWallet;
    constructor();
    getBalance(address: string, cryptoType: string): Promise<string>;
    transferCrypto(to: string, amount: string, cryptoType: string): Promise<string>;
    verifyTransaction(txHash: string): Promise<boolean>;
    estimateGas(to: string, amount: string, cryptoType: string): Promise<string>;
    getTokenBalance(tokenAddress: string, ownerAddress: string): Promise<string>;
    transfer(tokenAddress: string, to: string, amount: string): Promise<string>;
    approve(tokenAddress: string, spender: string, amount: string): Promise<string>;
    createWallet(): Promise<{
        address: string;
        privateKey: string;
    }>;
    getAddressFromPrivateKey(privateKey: string): string;
    signMessage(message: string, privateKey: string): Promise<string>;
    verifySignature(message: string, signature: string, address: string): Promise<boolean>;
    private getTokenContract;
}
