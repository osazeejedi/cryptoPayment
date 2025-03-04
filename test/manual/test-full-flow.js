const { testCheckout } = require('./test-checkout');
const { simulateWebhook } = require('./test-webhook');
const { checkPaymentStatus } = require('./test-payment-status');

async function testFullFlow() {
  console.log("=== TESTING FULL PAYMENT FLOW ===\n");
  
  // Step 1: Initialize checkout
  console.log("STEP 1: INITIALIZING CHECKOUT");
  const checkoutResult = await testCheckout();
  
  if (!checkoutResult || !checkoutResult.data.reference) {
    console.error("Failed to initialize checkout.");
    return;
  }
  
  const reference = checkoutResult.data.reference;
  console.log("\n✅ Checkout initialized successfully");
  
  // Step 2: Simulate webhook (payment confirmation)
  console.log("\nSTEP 2: SIMULATING PAYMENT WEBHOOK");
  console.log("Waiting 3 seconds...");
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const webhookResult = await simulateWebhook(reference);
  
  if (!webhookResult) {
    console.error("Failed to process webhook.");
    return;
  }
  
  console.log("\n✅ Webhook processed successfully");
  
  // Step 3: Check payment status
  console.log("\nSTEP 3: CHECKING PAYMENT STATUS");
  console.log("Waiting 3 seconds...");
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const statusResult = await checkPaymentStatus(reference);
  
  if (!statusResult) {
    console.error("Failed to check payment status.");
    return;
  }
  
  console.log("\n✅ Payment status verified");
  
  console.log("\n=== FULL PAYMENT FLOW COMPLETED SUCCESSFULLY ===");
  console.log("Reference:", reference);
}

// Run the test
testFullFlow(); 