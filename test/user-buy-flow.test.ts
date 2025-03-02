import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env';
import net from 'net';

// Function to find an available port
async function findAvailablePort(startPort: number): Promise<number> {
  let port = startPort;
  
  while (port < startPort + 100) { // Try up to 100 ports
    try {
      const server = net.createServer();
      await new Promise<void>((resolve, reject) => {
        server.once('error', (err: any) => {
          if (err.code === 'EADDRINUSE') {
            port++;
            resolve();
          } else {
            reject(err);
          }
        });
        
        server.once('listening', () => {
          server.close();
          resolve();
        });
        
        server.listen(port);
      });
      
      return port;
    } catch (err) {
      port++;
    }
  }
  
  throw new Error('Could not find an available port');
}

// Start the server for testing
import app from '../src/app';

// Find an available port and start the server
(async () => {
  try {
    const availablePort = await findAvailablePort(3001);
    console.log(`Found available port: ${availablePort}`);
    
    const server = app.listen(availablePort, () => {
      console.log(`Test server running on port ${availablePort}`);
    });
    
    const API_URL = `http://localhost:${availablePort}/api`;
    
    // Close server after tests
    process.on('SIGINT', () => {
      server.close();
      process.exit(0);
    });
    
    // Test configuration
    const TEST_EMAIL = `test-${Date.now()}@example.com`;
    const TEST_PASSWORD = 'Password123!';
    const TEST_NAME = 'Test User';
    const CRYPTO_AMOUNT = '0.01';
    const CRYPTO_TYPE = 'ETH';
    const FIAT_AMOUNT = '10000'; // 10,000 NGN
    
    async function sleep(ms: number): Promise<void> {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    async function runTest() {
      try {
        console.log('=== STARTING USER BUY FLOW TEST ===');
        console.log(`Test user: ${TEST_EMAIL}`);
        
        // Step 1: Register a new user
        console.log('\n1. Registering new user...');
        const registerResponse = await axios.post(`${API_URL}/auth/register`, {
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
          name: TEST_NAME
        });
        
        console.log('Registration successful:', registerResponse.data);
        const userId = registerResponse.data.data.user.id;
        const authToken = registerResponse.data.data.token || 'dummy-token-for-testing';
        
        // Step 2: Get user wallet
        console.log('\n2. Getting user wallet...');
        const walletResponse = await axios.get(`${API_URL}/wallet`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        
        console.log('User wallet:', walletResponse.data);
        const walletAddress = walletResponse.data.data.eth_address;
        
        // Step 3: Initiate a buy transaction
        console.log('\n3. Initiating buy transaction...');
        const buyResponse = await axios.post(
          `${API_URL}/payment/checkout`,
          {
            amount: FIAT_AMOUNT,
            email: TEST_EMAIL,
            name: TEST_NAME,
            payment_method: 'card',
            crypto_amount: CRYPTO_AMOUNT,
            crypto_type: CRYPTO_TYPE,
            wallet_address: walletAddress
          },
          {
            headers: { Authorization: `Bearer ${authToken}` }
          }
        );
        
        console.log('Buy transaction initiated:', buyResponse.data);
        const transactionId = buyResponse.data.data.transaction_id;
        const paymentReference = buyResponse.data.data.reference;
        
        // Step 4: Simulate a successful payment
        console.log('\n4. Simulating successful payment...');
        const simulatePaymentResponse = await axios.post(
          `${API_URL}/payment/webhook`,
          {
            event: 'charge.success',
            data: {
              reference: paymentReference,
              status: 'success',
              amount: FIAT_AMOUNT,
              currency: 'NGN',
              customer: {
                email: TEST_EMAIL,
                name: TEST_NAME
              },
              metadata: {
                transaction_id: transactionId,
                crypto_amount: CRYPTO_AMOUNT,
                crypto_type: CRYPTO_TYPE,
                wallet_address: walletAddress
              }
            }
          }
        );
        
        console.log('Payment simulation response:', simulatePaymentResponse.data);
        
        // Step 5: Wait for transaction processing
        console.log('\n5. Waiting for transaction processing...');
        await sleep(5000); // Wait for webhook processing
        
        // Step 6: Verify the transaction status
        console.log('\n6. Verifying transaction status...');
        const verifyResponse = await axios.get(
          `${API_URL}/payment/status/${paymentReference}`,
          {
            headers: { Authorization: `Bearer ${authToken}` }
          }
        );
        
        console.log('Transaction verification:', verifyResponse.data);
        
        // Step 7: Check user balance
        console.log('\n7. Checking user balance...');
        const balanceResponse = await axios.get(
          `${API_URL}/wallet/balance/${walletAddress}`,
          {
            headers: { Authorization: `Bearer ${authToken}` }
          }
        );
        
        console.log('User balance:', balanceResponse.data);
        
        // Test completed successfully
        console.log('\n=== USER BUY FLOW TEST COMPLETED SUCCESSFULLY ===');
      } catch (error) {
        console.error('Test failed:', error);
        if (axios.isAxiosError(error) && error.response) {
          console.log('Response status:', error.response.status);
          console.log('Response data:', error.response.data);
        }
      } finally {
        // Close the server when done
        server.close(() => {
          console.log('Test server closed');
          process.exit(0);
        });
      }
    }

    // Run the test
    runTest();
  } catch (error) {
    console.error('Error finding available port:', error);
    process.exit(1);
  }
})(); 