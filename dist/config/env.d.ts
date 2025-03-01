export declare const config: {
    server: {
        port: string | number;
        nodeEnv: string;
    };
    database: {
        host: string;
        port: number;
        name: string;
        user: string;
        password: string;
    };
    blockchain: {
        infuraApiKey: string;
        alchemyApiKey: string;
        companyWallet: {
            privateKey: string;
            address: string;
        };
    };
    api: {
        coingeckoApiKey: string;
        coinmarketcapApiKey: string;
    };
    security: {
        jwtSecret: string;
    };
};
