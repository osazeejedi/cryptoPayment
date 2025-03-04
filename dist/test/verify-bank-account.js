"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const korapayService_1 = require("../src/services/korapayService");
const readline_1 = __importDefault(require("readline"));
const rl = readline_1.default.createInterface({
    input: process.stdin,
    output: process.stdout
});
async function verifyBankAccount() {
    try {
        console.log('=== BANK ACCOUNT VERIFICATION TEST ===');
        // First, get the list of banks
        console.log('Fetching list of banks...');
        const banks = await korapayService_1.KorapayService.getBanks();
        console.log(`\nFound ${banks.length} banks. Here are the first 10:`);
        banks.slice(0, 10).forEach((bank, index) => {
            console.log(`${index + 1}. ${bank.name} (${bank.code})`);
        });
        // Get bank selection
        const bankIndex = await new Promise(resolve => {
            rl.question('\nEnter the number of the bank to use: ', answer => {
                const index = parseInt(answer.trim()) - 1;
                if (isNaN(index) || index < 0 || index >= banks.length) {
                    resolve(0); // Default to first bank if invalid
                }
                else {
                    resolve(index);
                }
            });
        });
        const selectedBank = banks[bankIndex];
        console.log(`\nSelected bank: ${selectedBank.name} (${selectedBank.code})`);
        // Get account number
        const accountNumber = await new Promise(resolve => {
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
        try {
            const accountDetails = await korapayService_1.KorapayService.verifyBankAccount(accountNumber, selectedBank.code);
            console.log('\nAccount verification successful!');
            console.log('Account Details:');
            console.log(`- Account Number: ${accountDetails.account_number}`);
            console.log(`- Account Name: ${accountDetails.account_name}`);
            console.log(`- Bank: ${accountDetails.bank_name} (${accountDetails.bank_code})`);
        }
        catch (verifyError) {
            console.error('\nAccount verification failed:', verifyError.message);
        }
        rl.close();
    }
    catch (error) {
        console.error('Error during bank account verification test:', error);
        rl.close();
    }
}
verifyBankAccount();
//# sourceMappingURL=verify-bank-account.js.map