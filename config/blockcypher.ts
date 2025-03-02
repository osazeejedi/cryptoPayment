import { config } from './env';

// BlockCypher configuration
export const blockCypherConfig = {
  token: config.blockchain.blockCypherToken,
  currency: 'eth',
  network: config.blockchain.network === 'mainnet' ? 'main' : 'test3', // test3 is for Sepolia
  apiUrl: 'https://api.blockcypher.com/v1'
};

// Create a helper function to get the full API URL
export const getBlockCypherUrl = (endpoint: string): string => {
  const { apiUrl, currency, network } = blockCypherConfig;
  return `${apiUrl}/${currency}/${network}${endpoint}`;
}; 