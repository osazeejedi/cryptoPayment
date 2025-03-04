const axios = require('axios');
const crypto = require('crypto');

// Configuration
const API_URL = 'http://localhost:3000/api'; // Change to your server URL

// This function generates a test webhook payload
async function simulateWebhook(reference) {
  if (!reference) {
    console.error("ERROR: Reference is required!");
    console.log("Run the checkout test first to get a reference");
    return null;
  }
  
  console.log("Simulating webhook for payment reference:", reference);
  
  // Create a webhook payload similar to what Korapay would send
  const webhookPayload = {
    event: "charge.success",
    data: {
      reference: reference,
      amount: "5000",
      status: "success",
      currency: "NGN",
      customer: {
        name: "Test Customer",
        email: "customer@example.com"
      },
      metadata: {
        crypto_amount: "0.01",
        crypto_type: "ETH",
        wallet_address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
      }
    }
  };
  
  // For testing, we'll use a simple signature
  // In production, Korapay uses a more complex signing mechanism
  const signature = "test-signature";
  
  console.log("Webhook payload:", JSON.stringify(webhookPayload, null, 2));
  
  try {
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
    console.log("Usage: node test-webhook.js <reference>");
    console.log("Example: node test-webhook.js TX-12345");
    process.exit(1);
  }
  
  simulateWebhook(reference);
}

module.exports = { simulateWebhook }; 