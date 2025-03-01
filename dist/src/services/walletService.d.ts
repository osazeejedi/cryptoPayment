export declare class WalletService {
    static getUserWallet(userId: string, walletAddress: string, walletPrivateKey: string): Promise<{
        address: string;
        privateKey: string;
    }>;
    static checkUserBalance(balance: string, amount: string): boolean;
    static getCompanyWallet(): {
        address: string;
        privateKey: string;
    };
}
