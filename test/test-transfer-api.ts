import axios from 'axios';
import readline from 'readline';
import { config } from '../config/env';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function testTransferApi() {
  try {
    console.log('=== TRANSFER API TEST ===');
    
    // Get API base URL
    const baseUrl = config.app.baseUrl || 'http://localhost:3000';
    console.log(`Using API base URL: ${baseUrl}`);
    
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
    
    // Get recipient address
    const recipientAddress = await new Promise<string>(resolve => {
      rl.question('\nEnter recipient address (0x...): ', answer => {
        resolve(answer.trim());
      });
    });
    
    // Get amount to send
    const amount = await new Promise<string>(resolve => {
      rl.question('\nEnter amount to send (ETH): ', answer => {
        resolve(answer.trim());
      });
    });
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      console.error('Invalid amount. Please enter a positive number.');
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
    
    console.log('\nSending API request...');
    
    // Send the API request
    const response = await axios.post(`${baseUrl}/api/transfer/send`, {
      from_private_key: privateKey,
      to_address: recipientAddress,
      amount,
      crypto_type: 'ETH'
    });
    
    console.log('\nAPI Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.status === 'success') {
      console.log(`\nTransaction Hash: ${response.data.data.transaction_hash}`);
      console.log(`View on Etherscan: https://sepolia.etherscan.io/tx/${response.data.data.transaction_hash}`);
    }
    
    rl.close();
  } catch (error) {
    console.error('Error during transfer API test:');
    if (axios.isAxiosError(error) && error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    } else {
      console.error(error);
    }
    rl.close();
  }
}

testTransferApi(); 