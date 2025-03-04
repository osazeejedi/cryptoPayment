import axios from 'axios';
import request from 'supertest';
import app from '../src/app';
import { BlockchainService } from '../src/services/blockchainService';
import { DatabaseService } from '../src/services/databaseService';
import { KorapayService } from '../src/services/korapayService';
import { PriceService } from '../src/services/priceService';
import { TransactionVerificationService } from '../src/services/transactionVerificationService';

const API_URL = 'https://cryptopayment.onrender.com/api';

// Test data for checkout
const TEST_CHECKOUT_DATA = {
  naira_amount: "500",
  crypto_type: "ETH",
  email: "customer@example.com",
  name: "Test Customer",
  wallet_address: "0x2A69d89043948999bD327413b7B4f91d47018873"
};

async function testCheckout() {
  console.log("Testing Payment Checkout...");
  
  try {
    const response = await axios.post(
      `${API_URL}/payment/checkout`, 
      TEST_CHECKOUT_DATA
    );
    
    console.log('\n=== Checkout Response ===');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('=========================\n');
    
    if (response.data.status === 'success' && response.data.data.checkout_url) {
      console.log('Checkout URL (open this in your browser to test payment):');
      console.log(response.data.data.checkout_url);
    }
    
    return true;
  } catch (error: any) {
    console.error('Checkout Error:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error message:', error.message);
    }
    return false;
  }
}

// Create a test for the complete checkout flow
describe('Checkout Flow', () => {
  beforeAll(() => {
    // Mock BlockchainService
    (BlockchainService.isValidAddress as jest.Mock).mockImplementation(() => true);
    (BlockchainService.transferCrypto as jest.Mock).mockImplementation(() => Promise.resolve('0xmocktxhash123'));
    (BlockchainService.verifyTransaction as jest.Mock).mockImplementation(() => Promise.resolve(true));
    
    // Mock DatabaseService
    (DatabaseService.createTransaction as jest.Mock).mockImplementation((data) => Promise.resolve({
      id: 'test-tx-123',
      user_id: data.user_id,
      amount: data.amount,
      cryptoAmount: data.amount,
      cryptoType: data.cryptoType,
      walletAddress: data.walletAddress || data.to_address,
      status: data.status,
      paymentMethod: data.paymentMethod,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    (DatabaseService.getTransactionByReference as jest.Mock).mockImplementation(() => Promise.resolve({
      id: 'test-tx-123',
      amount: '100',
      cryptoAmount: '0.00555',
      cryptoType: 'ETH',
      walletAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      status: 'pending',
      paymentMethod: 'card',
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    (DatabaseService.updateTransaction as jest.Mock).mockImplementation((id, data) => Promise.resolve({
      id,
      amount: '100',
      cryptoAmount: '0.00555',
      cryptoType: 'ETH',
      walletAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    // Mock KorapayService
    (KorapayService.initializePayment as jest.Mock).mockImplementation(() => Promise.resolve({
      checkoutUrl: 'https://checkout.korapay.com/test',
      reference: 'test-tx-123'
    }));
    (KorapayService.verifyWebhook as jest.Mock).mockImplementation(() => true);
    
    // Mock PriceService
    (PriceService.getCurrentPrice as jest.Mock).mockImplementation(() => Promise.resolve(3000));

    // Mock TransactionVerificationService
    (TransactionVerificationService.verifyTransaction as jest.Mock).mockImplementation(() => Promise.resolve(true));

    // Mock DatabaseService.getUserByEmail
    (DatabaseService.getUserByEmail as jest.Mock).mockImplementation(() => Promise.resolve({
      id: 'test-user-123',
      email: 'test@example.com',
      full_name: 'Test User'
    }));

    // Mock DatabaseService.createUser
    (DatabaseService.createUser as jest.Mock).mockImplementation(() => Promise.resolve({
      id: 'test-user-123',
      email: 'test@example.com',
      full_name: 'Test User'
    }));
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should initiate a purchase successfully', async () => {
    const response = await request(app)
      .post('/api/payment/checkout')
      .send({
        naira_amount: '500',
        crypto_type: 'ETH',
        wallet_address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        email: 'test@example.com',
        name: 'Test User'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success || response.body.status === 'success').toBeTruthy();
    expect(response.body.data.checkout_url).toBeTruthy();
    
    // Check that the services were called correctly
    expect(BlockchainService.isValidAddress).toHaveBeenCalledWith(
      '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      'ETH'
    );
    expect(DatabaseService.createTransaction).toHaveBeenCalled();
    expect(KorapayService.initializePayment).toHaveBeenCalled();
  });
  
  it('should process a webhook successfully', async () => {
    const response = await request(app)
      .post('/api/payment/webhook')
      .set('x-korapay-signature', 'test-signature')
      .send({
        event: 'charge.success',
        data: {
          reference: 'test-tx-123',
          status: 'success'
        }
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    
    // Check that the services were called correctly
    expect(KorapayService.verifyWebhook).toHaveBeenCalled();
    expect(DatabaseService.getTransactionByReference).toHaveBeenCalledWith('test-tx-123');
    expect(BlockchainService.transferCrypto).toHaveBeenCalledWith(
      '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      '0.00555',
      'ETH'
    );
    expect(DatabaseService.updateTransaction).toHaveBeenCalledWith(
      'test-tx-123',
      { status: 'completed', blockchainTxHash: '0xmocktxhash123' }
    );
  });
  
  it('should handle invalid wallet address', async () => {
    // Mock isValidAddress to return false for this test
    (BlockchainService.isValidAddress as jest.Mock).mockImplementationOnce(() => false);
    
    const response = await request(app)
      .post('/api/payment/checkout')
      .send({
        naira_amount: '500',
        crypto_type: 'ETH',
        wallet_address: 'invalid-address',
        email: 'test@example.com',
        name: 'Test User'
      });
    
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Invalid');
  });
  
  it('should handle missing required fields', async () => {
    const response = await request(app)
      .post('/api/payment/checkout')
      .send({
        // Missing required fields
        email: 'test@example.com',
        name: 'Test User'
      });
    
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Missing');
  });
}); 