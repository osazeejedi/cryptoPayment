export declare class BlockchainService {
    static transferCrypto(fromAddress: string, fromPrivateKey: string, toAddress: string, amount: string, cryptoType: string): Promise<string>;
    static processBuyRequest(userId: string, amount: string, cryptoType: string, nairaValue: string, userWalletAddress: string): Promise<string>;
    static processSellRequest(userId: string, amount: string, cryptoType: string, nairaValue: string, userWalletAddress: string, userWalletPrivateKey: string): Promise<string>;
}
