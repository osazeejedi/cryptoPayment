import Web3 from 'web3';
import { config } from './env';

// Use Alchemy for development/testing
const alchemyUrl = `https://eth-sepolia.g.alchemy.com/v2/${config.blockchain.alchemyApiKey}`;
// Create Web3 instance
const web3 = new Web3(alchemyUrl);

// Company wallet configuration
const companyWallet = {
  address: process.env.COMPANY_WALLET_ADDRESS,
  privateKey: process.env.COMPANY_WALLET_PRIVATE_KEY,
};

export { web3, companyWallet }; 