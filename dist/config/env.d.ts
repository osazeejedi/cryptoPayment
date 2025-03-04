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
        supabaseUrl: string;
        supabaseKey: string;
    };
    blockchain: {
        infuraApiKey: string;
        alchemyApiKey: string;
        companyWallet: {
            privateKey: string;
            address: string;
        };
        blockCypherToken: string;
        network: string;
        tokens: {
            usdt: string;
            usdc: string;
        };
    };
    api: {
        coingeckoApiKey: string;
        coinmarketcapApiKey: string;
    };
    payment: {
        korapay: {
            publicKey: string;
            secretKey: string;
            callbackUrl: string;
        };
    };
    security: {
        jwtSecret: string;
    };
    app: {
        env: string;
        port: number;
        baseUrl: string;
    };
    supabase: {
        url: string;
        serviceKey: string;
        anonKey: string;
    };
};
