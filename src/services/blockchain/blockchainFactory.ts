import { IBlockchainProvider, IERC20Provider, IWalletProvider } from '../../interfaces/blockchain';
import { EthereumProvider } from './ethereumProvider';
import { config } from '../../../config/env';

export class BlockchainFactory {
  private static instances: Record<string, IBlockchainProvider & IERC20Provider & IWalletProvider> = {};
  
  static getProvider(type: string = 'ethereum'): IBlockchainProvider & IERC20Provider & IWalletProvider {
    const providerType = type.toLowerCase();
    
    if (!this.instances[providerType]) {
      switch (providerType) {
        case 'ethereum':
        case 'eth':
          this.instances[providerType] = new EthereumProvider();
          break;
        // Add other blockchain providers here as needed
        default:
          throw new Error(`Unsupported blockchain provider type: ${type}`);
      }
    }
    
    return this.instances[providerType];
  }
} 