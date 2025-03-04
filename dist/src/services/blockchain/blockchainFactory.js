"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockchainFactory = void 0;
const ethereumProvider_1 = require("./ethereumProvider");
class BlockchainFactory {
    static getProvider(type = 'ethereum') {
        const providerType = type.toLowerCase();
        if (!this.instances[providerType]) {
            switch (providerType) {
                case 'ethereum':
                case 'eth':
                    this.instances[providerType] = new ethereumProvider_1.EthereumProvider();
                    break;
                // Add other blockchain providers here as needed
                default:
                    throw new Error(`Unsupported blockchain provider type: ${type}`);
            }
        }
        return this.instances[providerType];
    }
}
exports.BlockchainFactory = BlockchainFactory;
BlockchainFactory.instances = {};
