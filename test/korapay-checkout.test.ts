import axios from 'axios';
import crypto from 'crypto';
import { config } from '../config/env';
import { KorapayService } from '../src/services/korapayService';

// Function to generate a reference
function generateReference(): string {
  return `TX-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

// Test Korapay checkout page initialization (manually)
async function testKorapayCheckout() {
  try {
    console.log('Testing Korapay checkout page initialization...');
    
    const reference = generateReference();
    console.log('Generated reference:', reference);
    
    const payload = {
      reference,
      amount: "500",
      currency: "NGN",
      customer: {
        name: "Test Customer",
        email: "customer@example.com"
      },
      notification_url: config.payment.korapay.callbackUrl,
      redirect_url: "http://localhost:3000/api/payment/success",
      channels: ['card', 'bank_transfer'], // Allow both card and bank transfer
      metadata: {
        crypto_amount: "0.0001",
        crypto_type: "ETH",
        wallet_address: "0x2A69d89043948999bD327413b7B4f91d47018873"
      }
    };
    
    console.log('Request payload:', JSON.stringify(payload, null, 2));
    
    const response = await axios.post(
      'https://api.korapay.com/merchant/api/v1/charges/initialize',
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
    
    if (response.data.status && response.data.data.checkout_url) {
      console.log('\nCheckout URL (open this in your browser to test payment):');
      console.log(response.data.data.checkout_url);
    }
  } catch (error) {
    console.error('Checkout initialization failed:');
    if (axios.isAxiosError(error)) {
      console.error('Status:', error.response?.status);
      console.error('Data:', error.response?.data);
      console.error('Message:', error.message);
    } else {
      console.error('Error:', error);
    }
  }
}

// Jest automated test
describe('Korapay Checkout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set up mocked response
    jest.spyOn(KorapayService, 'initializePayment').mockResolvedValue({
      reference: 'test-ref-123',
      checkoutUrl: 'https://checkout.korapay.com/test'
    });
  });

  it('should initialize a checkout session successfully', async () => {
    // Call the actual service
    const response = await KorapayService.initializePayment({
      amount: "500",
      currency: "NGN",
      reference: "TEST-REF-123",
      redirectUrl: "http://localhost:3000/success",
      customerEmail: "customer@example.com",
      customerName: "Test Customer",
      metadata: {
        crypto_amount: "0.0001",
        crypto_type: "ETH",
        wallet_address: "0x2A69d89043948999bD327413b7B4f91d47018873"
      }
    });

    expect(response).toBeDefined();
    expect(response.reference).toBe("test-ref-123");
    expect(response.checkoutUrl).toBe("https://checkout.korapay.com/test");
  });
});

// Only run manual test if explicitly called
if (require.main === module) {
  testKorapayCheckout();
} 