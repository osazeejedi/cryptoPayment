import { BlockchainService } from '../src/services/blockchainService';
import { BalanceService } from '../src/services/balanceService';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function testSwap() {
  try {
    console.log('=== CRYPTOCURRENCY SWAP TEST ===');
    
    // Get sender's private key
    const privateKey = await new Promise<string>(resolve => {
      rl.question('Enter your private key (0x...): ', answer => {
        resolve(answer.trim());
      });
    });
    
    if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
      console.error('Invalid private key format. It should start with 0x and be 66 characters long.');
      rl.close();
      return;
    }
    
    // Get sender's address from private key
    let walletAddress;
    try {
      walletAddress = BlockchainService.getAddressFromPrivateKey(privateKey);
      console.log(`\nWallet address: ${walletAddress}`);
    } catch (error) {
      console.error('Error getting address from private key:', error);
      rl.close();
      return;
    }
    
    // Check wallet balances
    console.log('\nChecking wallet balances...');
    const ethBalance = await BalanceService.getWalletBalance(walletAddress, 'ETH');
    const usdtBalance = await BalanceService.getWalletBalance(walletAddress, 'USDT');
    console.log(`ETH Balance: ${ethBalance}`);
    console.log(`USDT Balance: ${usdtBalance}`);
    
    // Get swap direction
    const swapDirection = await new Promise<string>(resolve => {
      rl.question('\nSwap direction (1 for ETH->USDT, 2 for USDT->ETH): ', answer => {
        resolve(answer.trim());
      });
    });
    
    let fromCrypto: string;
    let toCrypto: string;
    let availableBalance: string;
    
    if (swapDirection === '1') {
      fromCrypto = 'ETH';
      toCrypto = 'USDT';
      availableBalance = ethBalance;
    } else if (swapDirection === '2') {
      fromCrypto = 'USDT';
      toCrypto = 'ETH';
      availableBalance = usdtBalance;
    } else {
      console.error('Invalid swap direction. Please enter 1 or 2.');
      rl.close();
      return;
    }
    
    console.log(`\nSwapping ${fromCrypto} to ${toCrypto}`);
    
    // Get amount to swap
    const amount = await new Promise<string>(resolve => {
      rl.question(`\nEnter amount to swap (max ${availableBalance} ${fromCrypto}): `, answer => {
        resolve(answer.trim());
      });
    });
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0 || numAmount > parseFloat(availableBalance)) {
      console.error('Invalid amount. Please enter a positive number not exceeding your balance.');
      rl.close();
      return;
    }
    
    // Get swap estimate
    console.log('\nGetting swap estimate...');
    const estimatedOutput = await BlockchainService.getSwapEstimate(
      amount,
      fromCrypto,
      toCrypto
    );
    
    console.log(`Estimated output: ${estimatedOutput} ${toCrypto}`);
    
    // Get slippage tolerance
    const slippage = await new Promise<string>(resolve => {
      rl.question('\nEnter slippage tolerance percentage (default 0.5): ', answer => {
        resolve(answer.trim() || '0.5');
      });
    });
    
    const slippageValue = parseFloat(slippage);
    if (isNaN(slippageValue) || slippageValue < 0 || slippageValue > 100) {
      console.error('Invalid slippage value. Using default 0.5%.');
    }
    
    // Confirm swap
    const confirmation = await new Promise<string>(resolve => {
      rl.question(`\nConfirm swapping ${amount} ${fromCrypto} for approximately ${estimatedOutput} ${toCrypto}? (y/n): `, answer => {
        resolve(answer.trim().toLowerCase());
      });
    });
    
    if (confirmation !== 'y' && confirmation !== 'yes') {
      console.log('Swap cancelled.');
      rl.close();
      return;
    }
    
    console.log('\nExecuting swap...');
    
    // Execute the swap
    const txHash = await BlockchainService.swapCrypto(
      privateKey,
      amount,
      fromCrypto,
      toCrypto,
      slippageValue || 0.5
    );
    
    console.log('\nSwap executed successfully!');
    console.log('Transaction Hash:', txHash);
    console.log(`View on Etherscan: https://sepolia.etherscan.io/tx/${txHash}`);
    
    // Check new balances after a few seconds
    console.log('\nWaiting 10 seconds to check new balances...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    const newEthBalance = await BalanceService.getWalletBalance(walletAddress, 'ETH');
    const newUsdtBalance = await BalanceService.getWalletBalance(walletAddress, 'USDT');
    console.log(`\nNew ETH Balance: ${newEthBalance}`);
    console.log(`New USDT Balance: ${newUsdtBalance}`);
    
    rl.close();
  } catch (error) {
    console.error('Error during swap test:', error);
    rl.close();
  }
}

testSwap(); 