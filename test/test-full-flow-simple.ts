import { KorapayService } from '../src/services/korapayService';
import fs from 'fs';
import path from 'path';

async function testFullFlowSimple() {
  try {
    console.log('=== TESTING FULL PAYMENT FLOW (SIMPLE VERSION) ===');
    
    // Step 1: Check if the logs directory exists, create it if not
    const logDir = path.resolve(__dirname, '../logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    // Step 2: Clear previous logs
    const logFile = path.join(logDir, 'webhook-debug.log');
    if (fs.existsSync(logFile)) {
      fs.writeFileSync(logFile, '');
      console.log('Cleared previous webhook logs.');
    }
    
    // Step 3: Initialize checkout
    console.log('\nInitializing checkout...');
    const checkout = await KorapayService.initializeCheckout(
      '500', // 500 Naira
      'customer@example.com',
      'Test Customer',
      '0.0001', // Crypto amount
      'ETH',
      '0x2A69d89043948999bD327413b7B4f91d47018873' // Test wallet address
    );
    
    console.log('Checkout initialized with reference:', checkout.reference);
    console.log('Checkout URL:', checkout.checkout_url);
    
    console.log('\nPlease manually open this URL in your browser to complete the payment:');
    console.log(checkout.checkout_url);
    
    console.log('\nAfter payment, run "npm run check:webhook-logs" to see if any webhooks were received.');
    console.log('Then run "npm run transfer:manual" to manually complete the crypto transfer.');
    
  } catch (error) {
    console.error('Error testing full payment flow:', error);
  }
}

testFullFlowSimple(); 