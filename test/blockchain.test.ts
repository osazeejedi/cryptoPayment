import { EthereumProvider } from '../src/services/blockchain/ethereumProvider';
import { BlockchainFactory } from '../src/services/blockchain/blockchainFactory';
import { ethers } from 'ethers';
import { config } from '../config/env';

// Mock the ethers library
jest.mock('ethers', () => {
  const original = jest.requireActual('ethers');
  
  return {
    ...original,
    JsonRpcProvider: jest.fn().mockImplementation(() => ({
      getBalance: jest.fn().mockResolvedValue(ethers.parseEther('1.0')),
      getBlockNumber: jest.fn().mockResolvedValue(100),
      getTransaction: jest.fn().mockResolvedValue({
        hash: '0x123',
        from: '0xabc',
        to: '0xdef'
      }),
      getTransactionReceipt: jest.fn().mockResolvedValue({
        blockNumber: 97,
        status: 1
      }),
      estimateGas: jest.fn().mockResolvedValue(ethers.parseUnits('21000', 'wei'))
    })),
    Contract: jest.fn().mockImplementation(() => ({
      balanceOf: jest.fn().mockResolvedValue(ethers.parseUnits('100', 18)),
      decimals: jest.fn().mockResolvedValue(18),
      transfer: jest.fn().mockResolvedValue({
        hash: '0x456',
        wait: jest.fn().mockResolvedValue({})
      }),
      approve: jest.fn().mockResolvedValue({
        hash: '0x789',
        wait: jest.fn().mockResolvedValue({})
      }),
      estimateGas: {
        transfer: jest.fn().mockResolvedValue(ethers.parseUnits('60000', 'wei'))
      }
    })),
    Wallet: {
      createRandom: jest.fn().mockReturnValue({
        address: '0x123abc',
        privateKey: '0xabc123'
      })
    }
  };
});

describe('EthereumProvider', () => {
  let provider: EthereumProvider;
  
  beforeEach(() => {
    provider = new EthereumProvider();
  });
  
  test('should get ETH balance', async () => {
    const balance = await provider.getBalance('0x123', 'ETH');
    expect(balance).toBe('1.0');
  });
  
  test('should get token balance', async () => {
    const balance = await provider.getBalance('0x123', 'USDT');
    expect(balance).toBe('100.0');
  });
  
  test('should transfer ETH', async () => {
    const txHash = await provider.transferCrypto('0x456', '0.1', 'ETH');
    expect(txHash).toBeTruthy();
  });
  
  test('should transfer tokens', async () => {
    const txHash = await provider.transferCrypto('0x456', '10', 'USDT');
    expect(txHash).toBeTruthy();
  });
  
  test('should verify transaction', async () => {
    const result = await provider.verifyTransaction('0x123');
    expect(result).toBe(true);
  });
  
  test('should create a wallet', async () => {
    const wallet = await provider.createWallet();
    expect(wallet.address).toBeTruthy();
    expect(wallet.privateKey).toBeTruthy();
  });
});

describe('BlockchainFactory', () => {
  test('should return Ethereum provider', () => {
    const provider = BlockchainFactory.getProvider('ethereum');
    expect(provider).toBeInstanceOf(EthereumProvider);
  });
  
  test('should return the same instance for the same type', () => {
    const provider1 = BlockchainFactory.getProvider('ethereum');
    const provider2 = BlockchainFactory.getProvider('ethereum');
    expect(provider1).toBe(provider2);
  });
  
  test('should throw error for unsupported provider', () => {
    expect(() => {
      BlockchainFactory.getProvider('bitcoin'); // Not implemented yet
    }).toThrow();
  });
}); 