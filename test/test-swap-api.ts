import axios from 'axios';
import readline from 'readline';
import { config } from '../config/env';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function testSwapApi() {
  try {
    console.log('=== SWAP API TEST ===');
    
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
    
    // Get swap direction
    const swapDirection = await new Promise<string>(resolve => {
      rl.question('\nSwap direction (1 for ETH->USDT, 2 for USDT->ETH): ', answer => {
        resolve(answer.trim());
      });
    });
    
    let fromCrypto: string;
    let toCrypto: string;
    
    if (swapDirection === '1') {
      fromCrypto = 'ETH';
      toCrypto = 'USDT';
    } else if (swapDirection === '2') {
      fromCrypto = 'USDT';
      toCrypto = 'ETH';
    } else {
      console.error('Invalid swap direction. Please enter 1 or 2.');
      rl.close();
      return;
    }
    
    // Get amount to swap
    const amount = await new Promise<string>(resolve => {
      rl.question(`\nEnter amount to swap (${fromCrypto}): `, answer => {
        resolve(answer.trim());
      });
    });
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      console.error('Invalid amount. Please enter a positive number.');
      rl.close();
      return;
    }
    
    // Get swap estimate
    console.log('\nGetting swap estimate...');
    const estimateResponse = await axios.get(`${baseUrl}/api/swap/estimate`, {
      params: {
        amount,
        from_crypto: fromCrypto,
        to_crypto: toCrypto
      }
    });
    
    console.log('Estimate Response:');
    console.log(JSON.stringify(estimateResponse.data, null, 2));
    
    const estimatedOutput = estimateResponse.data.data.estimated_output;
    console.log(`\nEstimated output: ${estimatedOutput} ${toCrypto}`);
    
    // Confirm swap
    const confirmation = await new Promise<string>(resolve => {
      rl.question(`\nConfirm swapping ${amount} ${fromCrypto} for approximately ${estimatedOutput} ${toCrypto}? (y/n): `, answer => {
        resolve(answer.trim().toLowerCase());
      });
    });
    
    if (confirmation !== 'y' && confirmation !== 'yes') {
      console.log('Swap cancelled.');
      rl.close();
      return;
    }
    
    console.log('\nExecuting swap via API...');
    
    // Execute the swap
    const swapResponse = await axios.post(`${baseUrl}/api/swap/execute`, {
      private_key: privateKey,
      amount,
      from_crypto: fromCrypto,
      to_crypto: toCrypto,
      slippage_percentage: 0.5
    });
    
    console.log('\nSwap API Response:');
    console.log(JSON.stringify(swapResponse.data, null, 2));
    
    if (swapResponse.data.status === 'success') {
      console.log(`\nTransaction Hash: ${swapResponse.data.data.transaction_hash}`);
      console.log(`View on Etherscan: https://sepolia.etherscan.io/tx/${swapResponse.data.data.transaction_hash}`);
    }
    
    rl.close();
  } catch (error) {
    console.error('Error during swap API test:');
    if (axios.isAxiosError(error) && error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    } else {
      console.error(error);
    }
    rl.close();
  }
}

testSwapApi(); 