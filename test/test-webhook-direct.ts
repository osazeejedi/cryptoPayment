import axios from 'axios';
import crypto from 'crypto';
import { config } from '../config/env';

async function testWebhookDirect() {
  try {
    console.log('=== TESTING WEBHOOK ENDPOINT DIRECTLY ===');
    
    // Create a test payload
    const payload = {
      event: 'charge.completed',
      data: {
        reference: `TEST-DIRECT-${Date.now()}`,
        status: 'success',
        amount: '500',
        currency: 'NGN',
        customer: {
          name: 'Test Customer',
          email: 'customer@example.com'
        },
        metadata: {
          crypto_amount: '0.0001',
          crypto_type: 'ETH',
          wallet_address: '0x2A69d89043948999bD327413b7B4f91d47018873'
        },
        payment_method: 'card',
        paid_at: new Date().toISOString()
      }
    };
    
    // Convert payload to string
    const payloadString = JSON.stringify(payload);
    
    // Generate signature
    const secretKey = config.payment.korapay.secretKey;
    console.log('Using secret key:', secretKey.substring(0, 5) + '...');
    
    const hmac = crypto.createHmac('sha512', secretKey);
    const signature = hmac.update(payloadString).digest('hex');
    
    console.log('Generated signature:', signature.substring(0, 10) + '...');
    
    // Send to your webhook endpoint directly
    console.log('Sending webhook to local endpoint...');
    
    const response = await axios.post(
      'http://localhost:3000/api/payment/webhook',
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Korapay-Signature': signature
        }
      }
    );
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
    console.log('\n=== WEBHOOK TEST COMPLETED ===');
  } catch (error) {
    console.error('Webhook test failed:');
    if (axios.isAxiosError(error)) {
      console.error('Status:', error.response?.status);
      console.error('Data:', error.response?.data);
    } else {
      console.error('Error:', error);
    }
  }
}

testWebhookDirect(); 