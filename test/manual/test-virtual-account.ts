import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const VIRTUAL_ACCOUNT = {
  account_name: "Ledisi Mark",
  account_number: "7650356726",
  bank_name: "Wema Bank",
  account_reference: "customer005",
  unique_id: "KPY-VA-RHpT9p0RDYwEKWt"
};

function displayPaymentInstructions() {
  console.log('\n=== Virtual Account Payment Instructions ===');
  console.log('Please make a payment to the following virtual account:');
  console.log(`Bank: ${VIRTUAL_ACCOUNT.bank_name}`);
  console.log(`Account Number: ${VIRTUAL_ACCOUNT.account_number}`);
  console.log(`Account Name: ${VIRTUAL_ACCOUNT.account_name}`);
  console.log('\nAfter payment:');
  console.log('1. Korapay will send a webhook to:', process.env.KORAPAY_CALLBACK_URL);
  console.log('2. Check your server logs for webhook processing\n');
}

// Run the instructions
async function run() {
  console.log('=== Testing Real Virtual Account Payment Flow ===\n');
  displayPaymentInstructions();
  console.log('\nPress Ctrl+C to exit when done.\n');
  
  // Keep process running to see logs
  await new Promise(() => {});
}

if (require.main === module) {
  run().catch(console.error);
} 