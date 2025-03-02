import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

// Test wallet addresses
const TEST_WALLET = {
  address: "0x2A69d89043948999bD327413b7B4f91d47018873",
  privateKey: "ce81f1cdf3183fd9d6b205ae9e72feaa3928eb022de20a1e5a2b4a856641f390"
};

const COMPANY_WALLET = {
  address: "0x2fE6Cee6a48a710Fb7EEE36A9C9C23DA7C756571"
};

// Test data
const TEST_USER_ID = "test_user_1";
const TEST_AMOUNT = "0.0001";
const TEST_CRYPTO = "ETH";
const TEST_NAIRA = "50000";

// Helper function to log responses
function logResponse(endpoint: string, data: any) {
  console.log(`\n=== ${endpoint} Response ===`);
  console.log(JSON.stringify(data, null, 2));
  console.log("=========================\n");
}

// Test functions
async function testPriceEndpoint() {
  console.log("Testing Price Endpoint...");
  
  try {
    // Test getting price per unit
    const priceResponse = await axios.get(`${API_URL}/price`, {
      params: { crypto_type: TEST_CRYPTO }
    });
    
    logResponse("Price Per Unit", priceResponse.data);
    
    // Test converting crypto to naira
    const conversionResponse = await axios.get(`${API_URL}/price`, {
      params: { 
        crypto_type: TEST_CRYPTO,
        amount: TEST_AMOUNT
      }
    });
    
    logResponse("Crypto to Naira Conversion", conversionResponse.data);
    
    return true;
  } catch (error: any) {
    console.error("Price Endpoint Error:", error.response?.data || error.message);
    return false;
  }
}

async function testConvertEndpoint() {
  console.log("Testing Convert Endpoint...");
  
  try {
    // Test converting naira to crypto
    const response = await axios.get(`${API_URL}/convert`, {
      params: { 
        naira_amount: TEST_NAIRA,
        crypto_type: TEST_CRYPTO
      }
    });
    
    logResponse("Naira to Crypto Conversion", response.data);
    
    return true;
  } catch (error: any) {
    console.error("Convert Endpoint Error:", error.response?.data || error.message);
    return false;
  }
}

async function testBalanceEndpoint() {
  console.log("Testing Balance Endpoint...");
  
  try {
    // Test getting ETH balance
    const response = await axios.get(`${API_URL}/balance`, {
      params: { wallet_address: TEST_WALLET.address }
    });
    
    logResponse("Wallet Balance", response.data);
    
    return true;
  } catch (error: any) {
    console.error("Balance Endpoint Error:", error.response?.data || error.message);
    return false;
  }
}

async function testBuyEndpoint() {
  console.log("Testing Buy Endpoint...");
  
  try {
    const response = await axios.post(`${API_URL}/buy`, {
      user_id: TEST_USER_ID,
      amount: TEST_AMOUNT,
      crypto_type: TEST_CRYPTO,
      wallet_address: TEST_WALLET.address
    });
    
    logResponse("Buy Request", response.data);
    
    return true;
  } catch (error: any) {
    console.error("Buy Endpoint Error:", error.response?.data || error.message);
    return false;
  }
}

async function testSellEndpoint() {
  console.log("Testing Sell Endpoint...");
  
  try {
    const response = await axios.post(`${API_URL}/sell`, {
      user_id: TEST_USER_ID,
      amount: TEST_AMOUNT,
      crypto_type: TEST_CRYPTO,
      wallet_address: TEST_WALLET.address,
      wallet_private_key: TEST_WALLET.privateKey,
      balance: "0.009"
    });
    
    logResponse("Sell Request", response.data);
    
    return true;
  } catch (error: any) {
    console.error("Sell Endpoint Error:", error.response?.data || error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log("=== Starting API Endpoint Tests ===\n");
  
  // Test information endpoints first
  await testPriceEndpoint();
  await testConvertEndpoint();
  await testBalanceEndpoint();
  
  // Then test transaction endpoints
  // await testBuyEndpoint();
  // await testSellEndpoint();
  
  console.log("\n=== API Endpoint Tests Complete ===");
}

// Execute tests
runTests(); 