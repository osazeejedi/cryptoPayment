"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBlockCypherUrl = exports.blockCypherConfig = void 0;
const env_1 = require("./env");
// BlockCypher configuration
exports.blockCypherConfig = {
    token: env_1.config.blockchain.blockCypherToken,
    currency: 'eth',
    network: env_1.config.blockchain.network === 'mainnet' ? 'main' : 'test3', // test3 is for Sepolia
    apiUrl: 'https://api.blockcypher.com/v1'
};
// Create a helper function to get the full API URL
const getBlockCypherUrl = (endpoint) => {
    const { apiUrl, currency, network } = exports.blockCypherConfig;
    return `${apiUrl}/${currency}/${network}${endpoint}`;
};
exports.getBlockCypherUrl = getBlockCypherUrl;
