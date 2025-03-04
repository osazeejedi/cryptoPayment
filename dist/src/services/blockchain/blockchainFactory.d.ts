import { IBlockchainProvider, IERC20Provider, IWalletProvider } from '../../interfaces/blockchain';
export declare class BlockchainFactory {
    private static instances;
    static getProvider(type?: string): IBlockchainProvider & IERC20Provider & IWalletProvider;
}
