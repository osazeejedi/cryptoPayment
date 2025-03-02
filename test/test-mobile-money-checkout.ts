import { KorapayService } from '../src/services/korapayService';
import fs from 'fs';
import path from 'path';

async function testMobileMoneyCheckout() {
  try {
    console.log('=== TESTING MOBILE MONEY CHECKOUT ===');
    
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
    
    // Step 3: Initialize checkout with mobile money
    console.log('\nInitializing checkout with mobile money...');
    
    // Create a custom version of initializeCheckout that only uses mobile_money
    const reference = KorapayService.generateReference();
    const debugWebhookUrl = `${config.payment.korapay.callbackUrl.replace('/api/payment/webhook', '/debug/log')}`;
    
    const payload = {
      reference,
      amount: '500',
      currency: 'NGN',
      customer: {
        name: 'Test Customer',
        email: 'customer@example.com'
      },
      notification_url: debugWebhookUrl,
      redirect_url: `${config.app.baseUrl}/api/payment/success`,
      channels: ['mobile_money'], // Only use mobile_money
      metadata: {
        crypto_amount: '0.0001',
        crypto_type: 'ETH',
        wallet_address: '0x2A69d89043948999bD327413b7B4f91d47018873'
      }
    };
    
    console.log('Checkout initialization payload:', JSON.stringify(payload, null, 2));
    
    const response = await axios.post(
      `${KorapayService.BASE_URL}/charges/initialize`,
      payload,
      {
        headers: KorapayService.getHeaders()
      }
    );
    
    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to initialize checkout');
    }
    
    const checkout = {
      checkout_url: response.data.data.checkout_url,
      reference: response.data.data.reference
    };
    
    console.log('Checkout initialized with reference:', checkout.reference);
    console.log('Checkout URL:', checkout.checkout_url);
    
    console.log('\nPlease manually open this URL in your browser to complete the payment:');
    console.log(checkout.checkout_url);
    
    console.log('\nAfter payment, run "npm run check:webhook-logs" to see if any webhooks were received.');
    console.log('Then run "npm run transfer:manual" to manually complete the crypto transfer.');
    
  } catch (error) {
    console.error('Error testing mobile money checkout:', error);
  }
}

testMobileMoneyCheckout(); 