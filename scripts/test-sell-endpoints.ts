import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:3000/api';

async function testGetBanks() {
  try {
    console.log('Testing GET /sell/banks endpoint...');
    const response = await axios.get(`${API_URL}/sell/banks`);
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Error testing getBanks:', error.response?.data || error.message);
  }
}

async function testVerifyBankAccount(accountNumber: string, bankCode: string) {
  try {
    console.log(`Testing POST /sell/verify-account endpoint with account ${accountNumber}, bank ${bankCode}...`);
    const response = await axios.post(`${API_URL}/sell/verify-account`, {
      account_number: accountNumber,
      bank_code: bankCode
    });
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Error testing verifyBankAccount:', error.response?.data || error.message);
  }
}

async function runTests() {
  // Test getBanks
  await testGetBanks();
  
  // Test verifyBankAccount with valid details
  await testVerifyBankAccount('1234567890', '033');
  
  // Test verifyBankAccount with invalid details
  await testVerifyBankAccount('0000000000', '033');
}

// Run the tests
runTests().catch(console.error); 