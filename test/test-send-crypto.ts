import { BlockchainService } from '../src/services/blockchainService';
import { BalanceService } from '../src/services/balanceService';
import readline from 'readline';
import { ethers } from 'ethers';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function testSendCrypto() {
  try {
    console.log('=== SEND CRYPTOCURRENCY TEST ===');
    
    // Get sender's private key
    const privateKey = await new Promise<string>(resolve => {
      rl.question('Enter your private key (0x...): ', answer => {
        resolve(answer.trim());
      });
    });
    
    if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
      console.error('Invalid private key format. It should start with 0x and be 66 characters long.');
      rl.close();
      return;
    }
    
    // Get sender's address from private key
    let senderAddress;
    try {
      senderAddress = BlockchainService.getAddressFromPrivateKey(privateKey);
      console.log(`\nSender's address: ${senderAddress}`);
    } catch (error) {
      console.error('Error getting address from private key:', error);
      rl.close();
      return;
    }
    
    // Check sender's balance
    console.log('\nChecking sender\'s balance...');
    const balance = await BalanceService.getWalletBalance(senderAddress, 'ETH');
    console.log(`Balance: ${balance} ETH`);
    
    if (parseFloat(balance) <= 0) {
      console.error('Insufficient balance. Please fund your wallet first.');
      rl.close();
      return;
    }
    
    // Get recipient address
    const recipientAddress = await new Promise<string>(resolve => {
      rl.question('\nEnter recipient address (0x...): ', answer => {
        resolve(answer.trim());
      });
    });
    
    if (!BlockchainService.isValidAddress(recipientAddress, 'ETH')) {
      console.error('Invalid ETH address.');
      rl.close();
      return;
    }
    
    // Get amount to send
    const amount = await new Promise<string>(resolve => {
      rl.question(`\nEnter amount to send (max ${balance} ETH): `, answer => {
        resolve(answer.trim());
      });
    });
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0 || numAmount > parseFloat(balance)) {
      console.error('Invalid amount. Please enter a positive number not exceeding your balance.');
      rl.close();
      return;
    }
    
    // Confirm transaction
    const confirmation = await new Promise<string>(resolve => {
      rl.question(`\nConfirm sending ${amount} ETH to ${recipientAddress}? (y/n): `, answer => {
        resolve(answer.trim().toLowerCase());
      });
    });
    
    if (confirmation !== 'y' && confirmation !== 'yes') {
      console.log('Transaction cancelled.');
      rl.close();
      return;
    }
    
    console.log('\nSending transaction...');
    
    // Send the transaction
    const txHash = await BlockchainService.sendCrypto(
      privateKey,
      recipientAddress,
      amount,
      'ETH'
    );
    
    console.log('\nTransaction sent successfully!');
    console.log('Transaction Hash:', txHash);
    console.log(`View on Etherscan: https://sepolia.etherscan.io/tx/${txHash}`);
    
    // Check new balance after a few seconds
    console.log('\nWaiting 5 seconds to check new balance...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const newBalance = await BalanceService.getWalletBalance(senderAddress, 'ETH');
    console.log(`\nNew balance: ${newBalance} ETH`);
    
    rl.close();
  } catch (error) {
    console.error('Error during send crypto test:', error);
    rl.close();
  }
}

testSendCrypto(); 