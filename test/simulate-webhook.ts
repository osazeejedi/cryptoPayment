import axios from 'axios';
import crypto from 'crypto';
import { config } from '../config/env';

// Function to generate a webhook signature
function generateSignature(payload: string, secretKey: string): string {
  const hmac = crypto.createHmac('sha512', secretKey);
  return hmac.update(payload).digest('hex');
}

// Function to simulate a webhook event
async function simulateWebhook() {
  try {
    // Create a sample webhook payload with all possible event names
    const events = ['charge.completed', 'charge.success', 'transaction.success'];
    
    for (const event of events) {
      const payload = {
        event,
        data: {
          reference: `TEST-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
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
      const signature = generateSignature(payloadString, config.payment.korapay.secretKey);
      
      console.log(`Simulating webhook event: ${event}...`);
      console.log('Payload:', payloadString);
      console.log('Signature:', signature);
      
      // Send webhook to your local server
      const webhookUrl = 'http://localhost:3000/api/payment/webhook';
      const response = await axios.post(webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Korapay-Signature': signature
        }
      });
      
      console.log(`Webhook response for ${event}:`, response.status, response.data);
      console.log('-----------------------------------');
      
      // Wait a bit between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  } catch (error) {
    console.error('Webhook simulation failed:');
    if (axios.isAxiosError(error)) {
      console.error('Status:', error.response?.status);
      console.error('Data:', error.response?.data);
    } else {
      console.error('Error:', error);
    }
  }
}

// Run the simulation
simulateWebhook(); 