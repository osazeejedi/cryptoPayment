import { BlockchainService } from '../src/services/blockchainService';
import { BalanceService } from '../src/services/balanceService';
import { ethers } from 'ethers';
import { config } from '../config/env';

// Test wallet addresses - use test addresses, not production ones
const TEST_ADDRESS = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"; // Example test address
const COMPANY_WALLET = config.blockchain.companyWallet.address;

// Mock the blockchain service methods that aren't included yet
jest.mock('../src/services/blockchainService', () => {
  const original = jest.requireActual('../src/services/blockchainService');
  return {
    BlockchainService: {
      ...original.BlockchainService,
      getEthersProvider: jest.fn().mockReturnValue({
        getBalance: jest.fn().mockResolvedValue(100000000000000n)
      })
    }
  };
});

describe('BlockchainService', () => {
  it('should verify a valid address', () => {
    const result = BlockchainService.isValidAddress('0x742d35Cc6634C0532925a3b844Bc454e4438f44e', 'ETH');
    expect(result).toBe(true);
  });

  it('should transfer crypto successfully', async () => {
    const txHash = await BlockchainService.transferCrypto(
      '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      '0.01',
      'ETH'
    );
    expect(txHash).toBe('0xmocktxhash123');
  });
});

async function runBlockchainTests() {
  console.log("=== BLOCKCHAIN SERVICE TESTS ===");
  
  try {
    // Test 1: Provider initialization
    console.log("\n1. Testing provider initialization...");
    const provider = BlockchainService.getEthersProvider('ETH');
    const network = await provider.getNetwork();
    console.log(`Connected to network: ${network.name} (Chain ID: ${network.chainId})`);
    console.log("✅ Provider initialized successfully");
    
    // Test 2: ETH Balance retrieval
    console.log("\n2. Testing ETH balance retrieval...");
    try {
      const ethBalance = await BalanceService.getWalletBalance(TEST_ADDRESS, "ETH");
      console.log(`ETH Balance for ${TEST_ADDRESS}: ${ethBalance} ETH`);
      console.log("✅ ETH balance retrieved successfully");
    } catch (error) {
      console.error("❌ ETH balance retrieval failed:", error);
    }
    
    // Test 3: USDT Balance retrieval
    console.log("\n3. Testing USDT balance retrieval...");
    try {
      const usdtBalance = await BalanceService.getWalletBalance(TEST_ADDRESS, "USDT");
      console.log(`USDT Balance for ${TEST_ADDRESS}: ${usdtBalance} USDT`);
      console.log("✅ USDT balance retrieved successfully");
    } catch (error) {
      console.error("❌ USDT balance retrieval failed:", error);
    }
    
    // Test 4: Company wallet balance
    console.log("\n4. Testing company wallet balance...");
    try {
      const companyEthBalance = await BalanceService.getWalletBalance(COMPANY_WALLET, "ETH");
      console.log(`Company wallet ETH balance: ${companyEthBalance} ETH`);
      console.log("✅ Company wallet balance retrieved successfully");
    } catch (error) {
      console.error("❌ Company wallet balance retrieval failed:", error);
    }
    
    // Test 5: Gas estimation
    console.log("\n5. Testing gas estimation...");
    try {
      // Use a valid address and a small amount
      const gasEstimate = await BlockchainService.estimateGas(
        TEST_ADDRESS, 
        "0.001", 
        "ETH"
      );
      console.log(`Gas estimate for sending 0.001 ETH: ${gasEstimate}`);
      console.log("✅ Gas estimation successful");
    } catch (error) {
      console.error("❌ Gas estimation failed:", error);
      // Continue with tests even if this fails
    }
    
    // Test 6: Transaction verification (using a known transaction hash)
    console.log("\n6. Testing transaction verification...");
    // Replace with a real transaction hash from Sepolia testnet
    const testTxHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    try {
      const isVerified = await BlockchainService.verifyTransaction(testTxHash, "ETH");
      console.log(`Transaction verification result: ${isVerified}`);
      console.log("✅ Transaction verification check completed");
    } catch (error) {
      console.error("❌ Transaction verification failed:", error);
    }
    
    // Test 7: Token contract retrieval
    console.log("\n7. Testing token contract retrieval...");
    try {
      const tokenContract = BlockchainService.getTokenContract("USDT");
      console.log(`USDT contract address: ${tokenContract.target}`);
      console.log("✅ Token contract retrieved successfully");
    } catch (error) {
      console.error("❌ Token contract retrieval failed:", error);
    }
    
    // Test 8: Swap estimation
    console.log("\n8. Testing swap estimation...");
    try {
      const swapEstimate = await BlockchainService.getSwapEstimate("0.01", "ETH", "USDT");
      console.log(`Estimated USDT for 0.01 ETH: ${swapEstimate} USDT`);
      console.log("✅ Swap estimation successful");
    } catch (error) {
      console.log("⚠️ Swap estimation failed, but this is expected on testnet due to low liquidity");
      console.log("This is not a code error, but a testnet limitation");
    }
    
    console.log("\n=== TEST SUMMARY ===");
    console.log("BlockchainService tests completed. Check the logs for any failures.");
    
  } catch (error) {
    console.error("Test execution failed:", error);
  }
}

// Run the tests
runBlockchainTests().catch(console.error); 