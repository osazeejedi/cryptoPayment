"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables from .env file
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
exports.config = {
    server: {
        port: process.env.PORT || 3000,
        nodeEnv: process.env.NODE_ENV || 'development',
    },
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        name: process.env.DB_NAME || 'crypto_transfer',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
    },
    blockchain: {
        infuraApiKey: process.env.INFURA_API_KEY || '',
        alchemyApiKey: process.env.ALCHEMY_API_KEY || '',
        companyWallet: {
            privateKey: process.env.COMPANY_WALLET_PRIVATE_KEY || '',
            address: process.env.COMPANY_WALLET_ADDRESS || '',
        },
    },
    api: {
        coingeckoApiKey: process.env.COINGECKO_API_KEY || '',
        coinmarketcapApiKey: process.env.COINMARKETCAP_API_KEY || '',
    },
    security: {
        jwtSecret: process.env.JWT_SECRET || 'default_jwt_secret',
    },
};
//# sourceMappingURL=env.js.map