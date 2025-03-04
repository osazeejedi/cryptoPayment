const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:3000/api'; // Change to your server URL

async function checkPaymentStatus(reference) {
  if (!reference) {
    console.error("ERROR: Reference is required!");
    console.log("Run the checkout test first to get a reference");
    return null;
  }
  
  console.log("Checking payment status for reference:", reference);
  
  try {
    const response = await axios.get(`${API_URL}/payment/status/${reference}`);
    
    console.log("Response status:", response.status);
    console.log("Response data:", JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error("ERROR:", error.response?.status, error.response?.data || error.message);
    return null;
  }
}

// If this file is executed directly
if (require.main === module) {
  // Get reference from command line argument
  const reference = process.argv[2];
  
  if (!reference) {
    console.log("Usage: node test-payment-status.js <reference>");
    console.log("Example: node test-payment-status.js TX-12345");
    process.exit(1);
  }
  
  checkPaymentStatus(reference);
}

module.exports = { checkPaymentStatus }; 