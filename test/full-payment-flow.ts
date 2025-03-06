import { KorapayService } from '../src/services/korapayService';
import axios from 'axios';
import crypto from 'crypto';
import { config } from '../config/env';
import { ethers } from 'ethers';
import readline from 'readline';

// Function to generate a webhook signature
function generateSignature(payload: string, secretKey: string): string {
  const hmac = crypto.createHmac('sha512', secretKey);
  return hmac.update(payload).digest('hex');
}

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt user
function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function testFullPaymentFlow() {
  try {
    console.log('=== TESTING FULL PAYMENT FLOW WITH REAL PAYMENT ===\n');
    
    // Step 1: Check company wallet balance
    console.log('Step 1: Checking company wallet balance...');
    const network = 'sepolia';
    const alchemyUrl = `https://eth-${network}.g.alchemy.com/v2/${config.blockchain.alchemyApiKey}`;
    const provider = new ethers.JsonRpcProvider(alchemyUrl);
    const walletAddress = config.blockchain.companyWallet.address;
    
    const balance = await provider.getBalance(walletAddress);
    console.log('Company wallet address:', walletAddress);
    console.log('Balance:', ethers.formatEther(balance), 'ETH');
    
    if (ethers.formatEther(balance) === '0.0') {
      console.error('ERROR: Your company wallet has no ETH on Sepolia testnet.');
      console.log('Please get some test ETH from a faucet before continuing.');
      rl.close();
      return;
    }
    
    console.log('Company wallet has sufficient balance.\n');
    
    // Step 2: Initialize checkout
    console.log('Step 2: Initializing checkout...');
    const checkout = await KorapayService.initializeCheckout(
      '100',
      'customer@example.com',
      'Test Customer',
      '0.0001',
      'ETH',
      '0x2A69d89043948999bD327413b7B4f91d47018873'
    );
    
    console.log('Checkout initialized with reference:', checkout.reference);
    console.log('\n=== CHECKOUT URL ===');
    console.log(checkout.checkout_url);
    console.log('\nPlease open this URL in your browser to complete the payment.');
    
    console.log('\n=== PAYMENT INSTRUCTIONS ===');
    console.log('1. Complete the payment in the browser window');
    console.log('2. For test cards, use:');
    console.log('   - Card Number: 5188 5133 1582 4543');
    console.log('   - Expiry Date: 09/32');
    console.log('   - CVV: 123');
    console.log('   - PIN: 1234');
    console.log('   - OTP: 123456');
    console.log('3. For bank transfer, follow the instructions on the checkout page');
    
    // Wait for user to confirm payment completion
    await prompt('\nAfter completing the payment, press Enter to continue...');
    
    // Step 4: Check transaction status using API
    console.log('\nStep 4: Checking transaction status...');
    
    // Get initial recipient balance
    const recipientAddress = '0x2A69d89043948999bD327413b7B4f91d47018873';
    const initialBalance = await provider.getBalance(recipientAddress);
    console.log('Initial recipient balance:', ethers.formatEther(initialBalance), 'ETH');
    
    // Check payment status via API
    try {
      const statusUrl = `${config.app.baseUrl}/api/payment/verify?reference=${checkout.reference}`;
      console.log(`Checking status at: ${statusUrl}`);
      
      const statusResponse = await axios.get(statusUrl);
      console.log('Payment status response:', JSON.stringify(statusResponse.data, null, 2));
    } catch (error) {
      console.error('Error checking payment status:', error);
      console.log('Continuing with the test...');
    }
    
    // Step 5: Wait for transaction to be mined
    console.log('\nStep 5: Waiting for transaction to be mined...');
    console.log('This may take a few minutes on the testnet.');
    
    // Wait for 30 seconds to allow the transaction to be mined
    console.log('Waiting 30 seconds...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    // Step 6: Check the recipient's balance
    console.log('\nStep 6: Checking recipient balance...');
    const finalBalance = await provider.getBalance(recipientAddress);
    console.log('Recipient address:', recipientAddress);
    console.log('Final recipient balance:', ethers.formatEther(finalBalance), 'ETH');
    
    // Calculate the difference
    const balanceDifference = finalBalance - initialBalance;
    console.log('Balance difference:', ethers.formatEther(balanceDifference), 'ETH');
    
    if (balanceDifference > 0) {
      console.log('\n✅ SUCCESS: Crypto was transferred to the recipient wallet!');
    } else {
      console.log('\n❌ NOTE: No change in recipient balance detected.');
      console.log('This could mean:');
      console.log('1. The transaction is still pending');
      console.log('2. The transaction failed');
      console.log('3. The webhook was not processed correctly');
      console.log('\nConsider using manual-blockchain-transfer.ts to complete the transfer if needed.');
    }
    
    console.log('\n=== FULL PAYMENT FLOW TEST COMPLETED ===');
    rl.close();
  } catch (error) {
    console.error('Full payment flow test failed:', error);
    rl.close();
  }
}

testFullPaymentFlow();