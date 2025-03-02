import { KorapayService } from '../src/services/korapayService';
import { PriceService } from '../src/services/priceService';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function testSellFlow() {
  try {
    console.log('=== CRYPTO SELL FLOW TEST ===');
    
    // Get crypto details
    const cryptoType = await new Promise<string>(resolve => {
      rl.question('Enter crypto type (ETH): ', answer => {
        resolve(answer.trim().toUpperCase() || 'ETH');
      });
    });
    
    const cryptoAmount = await new Promise<string>(resolve => {
      rl.question(`Enter ${cryptoType} amount to sell: `, answer => {
        resolve(answer.trim());
      });
    });
    
    if (isNaN(parseFloat(cryptoAmount)) || parseFloat(cryptoAmount) <= 0) {
      console.error('Invalid amount. Please provide a positive number.');
      rl.close();
      return;
    }
    
    // Convert crypto to Naira
    console.log(`\nConverting ${cryptoAmount} ${cryptoType} to Naira...`);
    const nairaAmount = await PriceService.convertCryptoToNaira(
      cryptoAmount,
      cryptoType
    );
    
    console.log(`Equivalent amount: NGN ${nairaAmount}`);
    
    // First, get the list of banks
    console.log('\nFetching list of banks...');
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
    
    // Confirm sell
    const confirmation = await new Promise<string>(resolve => {
      rl.question(`\nConfirm selling ${cryptoAmount} ${cryptoType} for NGN ${nairaAmount} to be sent to ${accountName} (${accountNumber})? (y/n): `, answer => {
        resolve(answer.trim().toLowerCase());
      });
    });
    
    if (confirmation !== 'y' && confirmation !== 'yes') {
      console.log('Sell operation cancelled.');
      rl.close();
      return;
    }
    
    console.log('\nProcessing sell request...');
    
    // Generate a reference for this transaction
    const reference = KorapayService.generateReference();
    
    // Process bank payout
    const payoutResult = await KorapayService.processBankPayout(
      nairaAmount,
      accountNumber,
      selectedBank.code,
      accountName,
      `Crypto sale: ${cryptoAmount} ${cryptoType}`,
      reference
    );
    
    console.log('\nSell request processed successfully!');
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
    console.error('Error during sell flow test:', error);
    rl.close();
  }
}

testSellFlow(); 