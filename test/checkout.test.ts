import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

// Test data for checkout
const TEST_CHECKOUT_DATA = {
  naira_amount: "500",
  crypto_type: "ETH",
  email: "customer@example.com",
  name: "Test Customer",
  wallet_address: "0x2A69d89043948999bD327413b7B4f91d47018873"
};

async function testCheckout() {
  console.log("Testing Payment Checkout...");
  
  try {
    const response = await axios.post(
      `${API_URL}/payment/checkout`, 
      TEST_CHECKOUT_DATA
    );
    
    console.log('\n=== Checkout Response ===');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('=========================\n');
    
    if (response.data.status === 'success' && response.data.data.checkout_url) {
      console.log('Checkout URL (open this in your browser to test payment):');
      console.log(response.data.data.checkout_url);
    }
    
    return true;
  } catch (error: any) {
    console.error('Checkout Error:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error message:', error.message);
    }
    return false;
  }
}

// Run test
testCheckout(); 