import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const config = {
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