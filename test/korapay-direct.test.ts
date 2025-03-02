import axios from 'axios';
import crypto from 'crypto';
import { config } from '../config/env';

// Function to generate a reference
function generateReference(): string {
  return `TX-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

// Test direct card payment with Korapay
async function testDirectCardPayment() {
  try {
    console.log('Testing direct card payment with Korapay...');
    
    const reference = generateReference();
    console.log('Generated reference:', reference);
    
    // Test card data
    const cardData = {
      number: "5399838383838381", // Korapay test card for successful payment
      expiry_month: "10",
      expiry_year: "25",
      cvv: "123"
    };
    
    const payload = {
      reference,
      amount: "500",
      currency: "NGN",
      customer: {
        name: "Test Customer",
        email: "customer@example.com",
        phone: "08012345678"
      },
      notification_url: config.payment.korapay.callbackUrl,
      card: {
        ...cardData,
        address: "123 Test Street",
        postal_code: "12345",
        country: "NG"
      },
      metadata: {
        crypto_amount: "0.0001",
        crypto_type: "ETH",
        wallet_address: "0x2A69d89043948999bD327413b7B4f91d47018873"
      }
    };
    
    console.log('Request payload:', JSON.stringify(payload, null, 2));
    
    const response = await axios.post(
      'https://api.korapay.com/merchant/api/v1/charges/card',
      payload,
      {
        headers: {
          'Authorization': `Bearer ${config.payment.korapay.secretKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Direct card payment test failed:');
    if (axios.isAxiosError(error)) {
      console.error('Status:', error.response?.status);
      console.error('Data:', error.response?.data);
      console.error('Message:', error.message);
    } else {
      console.error('Error:', error);
    }
  }
}

// Run the test
testDirectCardPayment(); 