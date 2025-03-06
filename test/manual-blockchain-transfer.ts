import { BlockchainService } from '../src/services/blockchainService';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function manualBlockchainTransfer() {
  try {
    console.log('=== MANUAL BLOCKCHAIN TRANSFER ===');
    
    // Get wallet address
    const walletAddress = await new Promise<string>(resolve => {
      rl.question('Enter recipient wallet address: ', answer => {
        resolve(answer.trim());
      });
    });
    
    if (!BlockchainService.isValidAddress(walletAddress, 'ETH')) {
      console.error('Invalid wallet address. Please provide a valid Ethereum address.');
      rl.close();
      return;
    }
    
    // Get crypto amount
    const cryptoAmount = await new Promise<string>(resolve => {
      rl.question('Enter crypto amount (e.g., 0.0001): ', answer => {
        resolve(answer.trim());
      });
    });
    
    if (isNaN(parseFloat(cryptoAmount)) || parseFloat(cryptoAmount) <= 0) {
      console.error('Invalid amount. Please provide a positive number.');
      rl.close();
      return;
    }
    
    // Get crypto type
    const cryptoType = await new Promise<string>(resolve => {
      rl.question('Enter crypto type (ETH): ', answer => {
        resolve(answer.trim() || 'ETH');
      });
    });
    
    // Confirm transfer
    const confirmation = await new Promise<string>(resolve => {
      rl.question(`Confirm transfer of ${cryptoAmount} ${cryptoType} to ${walletAddress}? (y/n): `, answer => {
        resolve(answer.trim().toLowerCase());
      });
    });
    
    if (confirmation !== 'y' && confirmation !== 'yes') {
      console.log('Transfer cancelled.');
      rl.close();
      return;
    }
    
    console.log(`\nInitiating transfer of ${cryptoAmount} ${cryptoType} to ${walletAddress}...`);
    
    const txHash = await BlockchainService.transferCrypto(
      walletAddress,
      cryptoAmount,
      cryptoType
    );
    
    console.log('\nTransfer successful!');
    console.log('Transaction Hash:', txHash);
    
    rl.close();
  } catch (error) {
    console.error('Error during manual blockchain transfer:', error);
    rl.close();
  }
}

manualBlockchainTransfer(); 