import { KorapayService } from '../src/services/korapayService';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function testBankPayout() {
  try {
    console.log('=== BANK PAYOUT TEST ===');
    
    // First, get the list of banks
    console.log('Fetching list of banks...');
    const banks = await KorapayService.getBanks();
    
    console.log(`\nFound ${banks.length} banks. Here are the first 10:`);
    banks.slice(0, 10).forEach((bank, index) => {
      console.log(`${index + 1}. ${bank.name} (${bank.code})`);
    });
    
    // Get bank selection
    const bankIndex = await new Promise<number>(resolve => {
      rl.question('\nEnter the number of the bank to use: ', answer => {
        const index = parseInt(answer.trim()) - 1;
        if (isNaN(index) || index < 0 || index >= banks.length) {
          resolve(0); // Default to first bank if invalid
        } else {
          resolve(index);
        }
      });
    });
    
    const selectedBank = banks[bankIndex];
    console.log(`\nSelected bank: ${selectedBank.name} (${selectedBank.code})`);
    
    // Get account number
    const accountNumber = await new Promise<string>(resolve => {
      rl.question('Enter account number: ', answer => {
        resolve(answer.trim());
      });
    });
    
    if (accountNumber.length < 10) {
      console.error('Invalid account number. Account numbers should be at least 10 digits.');
      rl.close();
      return;
    }
    
    console.log(`\nVerifying account number ${accountNumber} with bank code ${selectedBank.code}...`);
    
    let accountName;
    try {
      const accountDetails = await KorapayService.verifyBankAccount(
        accountNumber,
        selectedBank.code
      );
      
      accountName = accountDetails.account_name;
      
      console.log('\nAccount verification successful!');
      console.log('Account Details:');
      console.log(`- Account Number: ${accountDetails.account_number}`);
      console.log(`- Account Name: ${accountDetails.account_name}`);
      console.log(`- Bank: ${accountDetails.bank_name} (${accountDetails.bank_code})`);
    } catch (verifyError) {
      console.error('\nAccount verification failed:', verifyError.message);
      rl.close();
      return;
    }
    
    // Get amount
    const amount = await new Promise<string>(resolve => {
      rl.question('\nEnter amount to send (NGN): ', answer => {
        resolve(answer.trim());
      });
    });
    
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      console.error('Invalid amount. Please provide a positive number.');
      rl.close();
      return;
    }
    
    // Get narration
    const narration = await new Promise<string>(resolve => {
      rl.question('Enter transaction narration/description: ', answer => {
        resolve(answer.trim() || 'Test payout');
      });
    });
    
    // Confirm payout
    const confirmation = await new Promise<string>(resolve => {
      rl.question(`\nConfirm payout of NGN ${amount} to ${accountName} (${accountNumber})? (y/n): `, answer => {
        resolve(answer.trim().toLowerCase());
      });
    });
    
    if (confirmation !== 'y' && confirmation !== 'yes') {
      console.log('Payout cancelled.');
      rl.close();
      return;
    }
    
    console.log('\nProcessing bank payout...');
    
    const payoutResult = await KorapayService.processBankPayout(
      amount,
      accountNumber,
      selectedBank.code,
      accountName,
      narration
    );
    
    console.log('\nPayout initiated successfully!');
    console.log('Reference:', payoutResult.reference);
    console.log('Status:', payoutResult.status);
    console.log('Fee:', payoutResult.fee);
    
    // Check status after a few seconds
    console.log('\nWaiting 5 seconds to check status...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log(`\nChecking status for reference: ${payoutResult.reference}`);
    const statusResult = await KorapayService.checkPayoutStatus(payoutResult.reference);
    
    console.log('\nCurrent status:');
    console.log('Status:', statusResult.status);
    console.log('Amount:', statusResult.amount);
    console.log('Fee:', statusResult.fee);
    console.log('Total Amount:', statusResult.total_amount);
    console.log('Currency:', statusResult.currency);
    
    rl.close();
  } catch (error) {
    console.error('Error during bank payout test:', error);
    rl.close();
  }
}

testBankPayout(); 