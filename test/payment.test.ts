import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

// Test data for card payment
const TEST_CARD_PAYMENT = {
  naira_amount: "500",
  crypto_type: "ETH",
  email: "customer@example.com",
  name: "Test Customer",
  wallet_address: "0x2A69d89043948999bD327413b7B4f91d47018873",
  card_number: "4111111111111111", // Standard test Visa card
  card_expiry: "12/25",
  card_cvv: "123"
};

// Test data for bank transfer
const TEST_BANK_TRANSFER = {
  naira_amount: "500",
  crypto_type: "ETH",
  email: "customer@example.com",
  name: "Test Customer",
  wallet_address: "0x2A69d89043948999bD327413b7B4f91d47018873",
  bank_code: "058", // Guaranty Trust Bank
  account_number: "0123456789"
};

async function testGetBanks() {
  console.log("Testing Get Banks...");
  
  try {
    const response = await axios.get(`${API_URL}/payment/banks`);
    
    console.log('\n=== Available Banks ===');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('=======================\n');
    
    return true;
  } catch (error: any) {
    console.error('Get Banks Error:', error.response?.data || error.message);
    return false;
  }
}

async function testCardPayment() {
  console.log("Testing Card Payment...");
  
  try {
    console.log("Card payment request data:", JSON.stringify(TEST_CARD_PAYMENT, null, 2));
    
    const response = await axios.post(
      `${API_URL}/payment/card`, 
      TEST_CARD_PAYMENT
    );
    
    console.log('\n=== Card Payment Response ===');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('============================\n');
    
    // If successful, test verification
    if (response.data.status === 'success' && response.data.data.reference) {
      await testVerifyPayment(response.data.data.reference);
    }
    
    return true;
  } catch (error: any) {
    console.error('Card Payment Error:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error message:', error.message);
    }
    return false;
  }
}

async function testBankTransfer() {
  console.log("Testing Bank Transfer...");
  
  try {
    const response = await axios.post(
      `${API_URL}/payment/bank-transfer`, 
      TEST_BANK_TRANSFER
    );
    
    console.log('\n=== Bank Transfer Response ===');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('==============================\n');
    
    // If successful, test verification
    if ((response.data.status === 'success' || response.data.status === 'pending') && 
        response.data.data.reference) {
      await testVerifyPayment(response.data.data.reference);
    }
    
    return true;
  } catch (error: any) {
    console.error('Bank Transfer Error:', error.response?.data || error.message);
    return false;
  }
}

async function testVerifyPayment(reference: string) {
  console.log(`Testing Payment Verification for reference: ${reference}...`);
  
  try {
    const response = await axios.get(`${API_URL}/payment/verify/${reference}`);
    
    console.log('\n=== Payment Verification Response ===');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('=====================================\n');
    
    return true;
  } catch (error: any) {
    console.error('Payment Verification Error:', error.response?.data || error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log("=== Starting Payment API Tests ===\n");
  
  // First get available banks
  await testGetBanks();
  
  // Test card payment
  await testCardPayment();
  
  // Test bank transfer
  await testBankTransfer();
  
  console.log("\n=== Payment API Tests Complete ===");
}

// Execute tests
runTests(); 