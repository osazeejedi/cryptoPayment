import { BlockchainService } from '../src/services/blockchainService';
import { ethers } from 'ethers';
import { config } from '../config/env';

async function testBlockchainService() {
  try {
    console.log('=== TESTING BLOCKCHAIN SERVICE ===');
    
    // Check if the wallet address is valid
    const testAddress = '0x2A69d89043948999bD327413b7B4f91d47018873';
    const isValid = BlockchainService.isValidAddress(testAddress);
    console.log('Is wallet address valid:', isValid);
    
    // Check company wallet
    console.log('Company wallet address:', config.blockchain.companyWallet.address);
    
    // Get provider
    const network = 'sepolia';
    const alchemyUrl = `https://eth-${network}.g.alchemy.com/v2/${config.blockchain.alchemyApiKey}`;
    const provider = new ethers.JsonRpcProvider(alchemyUrl);
    
    // Check network
    const networkInfo = await provider.getNetwork();
    console.log('Connected to network:', networkInfo.name);
    
    // Check company wallet balance
    const balance = await provider.getBalance(config.blockchain.companyWallet.address);
    console.log('Company wallet balance:', ethers.formatEther(balance), 'ETH');
    
    // Test a small transfer (0.0001 ETH)
    console.log('\nTesting a small transfer of 0.0001 ETH...');
    
    try {
      const txHash = await BlockchainService.transferCrypto(
        testAddress,
        '0.0001',
        'ETH'
      );
      
      console.log('Transfer successful!');
      console.log('Transaction hash:', txHash);
    } catch (transferError) {
      console.error('Transfer failed:', transferError);
    }
    
    console.log('\n=== BLOCKCHAIN SERVICE TEST COMPLETED ===');
  } catch (error) {
    console.error('Error testing blockchain service:', error);
  }
}

testBlockchainService(); 