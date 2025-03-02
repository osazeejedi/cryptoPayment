import { BalanceService } from '../src/services/balanceService';
import { config } from '../config/env';

async function checkBalance() {
  try {
    console.log('Checking company wallet balance...');
    console.log('Company wallet address:', config.blockchain.companyWallet.address);
    
    const balance = await BalanceService.getBalance(config.blockchain.companyWallet.address);
    
    console.log('ETH Balance:', balance.eth);
    console.log('USD Value:', balance.usd_value);
  } catch (error) {
    console.error('Error checking balance:', error);
  }
}

checkBalance(); 