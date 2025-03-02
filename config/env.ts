import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Log loaded environment variables (without sensitive data)
console.log('Environment loaded:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  APP_BASE_URL: process.env.APP_BASE_URL,
  KORAPAY_CALLBACK_URL: process.env.KORAPAY_CALLBACK_URL,
  // Log keys existence but not their values
  KORAPAY_PUBLIC_KEY: process.env.KORAPAY_PUBLIC_KEY ? 'Set' : 'Not set',
  KORAPAY_SECRET_KEY: process.env.KORAPAY_SECRET_KEY ? 'Set' : 'Not set',
  COMPANY_WALLET_ADDRESS: process.env.COMPANY_WALLET_ADDRESS ? 'Set' : 'Not set',
  COMPANY_WALLET_PRIVATE_KEY: process.env.COMPANY_WALLET_PRIVATE_KEY ? 'Set' : 'Not set',
});

// Update the DatabaseConfig interface
interface DatabaseConfig {
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
  supabaseUrl: string;
  supabaseKey: string;
}

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
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseKey: process.env.SUPABASE_KEY || '',
  },
  blockchain: {
    infuraApiKey: process.env.INFURA_API_KEY || '',
    alchemyApiKey: process.env.ALCHEMY_API_KEY || '',
    companyWallet: {
      privateKey: process.env.COMPANY_WALLET_PRIVATE_KEY || '',
      address: process.env.COMPANY_WALLET_ADDRESS || '',
    },
    blockCypherToken: process.env.BLOCKCYPHER_TOKEN || '',
    network: process.env.BLOCKCHAIN_NETWORK || 'sepolia', // 'mainnet' or 'sepolia'
  },
  api: {
    coingeckoApiKey: process.env.COINGECKO_API_KEY || '',
    coinmarketcapApiKey: process.env.COINMARKETCAP_API_KEY || '',
  },
  payment: {
    korapay: {
      publicKey: process.env.KORAPAY_PUBLIC_KEY || process.env.KORAPAY_PUBLIC_KEY_ALT || '',
      secretKey: process.env.KORAPAY_SECRET_KEY || process.env.KORAPAY_SECRET_KEY_ALT || '',
      callbackUrl: process.env.KORAPAY_CALLBACK_URL || 'http://localhost:3000/api/payment/webhook'
    },
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || 'default_jwt_secret',
  },
  app: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    baseUrl: process.env.APP_BASE_URL || 'http://localhost:3000',
  },
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceKey: process.env.SUPABASE_SERVICE_KEY || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
  },
};

// Validate critical configuration
if (!config.payment.korapay.publicKey || !config.payment.korapay.secretKey) {
  console.error('ERROR: Korapay API keys are not configured. Please check your .env file.');
}

if (!config.blockchain.companyWallet.address || !config.blockchain.companyWallet.privateKey) {
  console.error('ERROR: Company wallet is not configured. Please check your .env file.');
}

if (!config.blockchain.alchemyApiKey) {
  console.error('ERROR: Alchemy API key is not configured. Please check your .env file.');
} 