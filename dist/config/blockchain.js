"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.companyWallet = exports.web3 = void 0;
const web3_1 = __importDefault(require("web3"));
const env_1 = require("./env");
// Use Alchemy for development/testing
const alchemyUrl = `https://eth-sepolia.g.alchemy.com/v2/${env_1.config.blockchain.alchemyApiKey}`;
// Create Web3 instance
const web3 = new web3_1.default(alchemyUrl);
exports.web3 = web3;
// Company wallet configuration
const companyWallet = {
    address: process.env.COMPANY_WALLET_ADDRESS,
    privateKey: process.env.COMPANY_WALLET_PRIVATE_KEY,
};
exports.companyWallet = companyWallet;
//# sourceMappingURL=blockchain.js.map