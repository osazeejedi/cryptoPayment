import axios from 'axios';
import crypto from 'crypto';
import { config } from '../config/env';

const API_URL = 'http://localhost:3000/api';

// Function to simulate a webhook from Korapay
async function simulateWebhook(transactionReference: string) {
  console.log(`Simulating webhook for transaction: ${transactionReference}`);
  
  // Create webhook payload
  const webhookPayload = {
    event: 'charge.success',
    data: {
      reference: transactionReference,
      status: 'success',
      amount: '100.00',
      currency: 'NGN',
      fee: '2.50',
      customer: {
        name: 'Test Customer',
        email: 'customer@example.com'
      },
      payment_method: 'card',
      paid_at: new Date().toISOString()
    }
  };
  
  // Create signature (similar to how Korapay would)
  const payload = JSON.stringify(webhookPayload);
  const signature = crypto
    .createHmac('sha256', config.payment.korapay.secretKey)
    .update(payload)
    .digest('hex');
  
  try {
    // Send webhook
    const response = await axios.post(
      `${API_URL}/payment/webhook`,
      webhookPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-korapay-signature': signature
        }
      }
    );
    
    console.log('\n=== Webhook Response ===');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('=========================\n');
    
    return true;
  } catch (error: any) {
    console.error('Webhook Simulation Error:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error message:', error.message);
    }
    return false;
  }
}

// Get transaction reference from command line
const transactionReference = process.argv[2];

if (!transactionReference) {
  console.error('Please provide a transaction reference as a command line argument');
  process.exit(1);
}

// Run simulation
simulateWebhook(transactionReference); 