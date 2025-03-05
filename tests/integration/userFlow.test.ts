import request from 'supertest';
import app from '../../src/app';
import { v4 as uuidv4 } from 'uuid';

// Mock all external dependencies
jest.mock('../../src/services/blockchainService');
jest.mock('../../src/services/databaseService');
jest.mock('../../config/supabase');

describe('User Flow Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let walletAddress: string;
  
  // Test user credentials
  const testUser = {
    email: `test-${uuidv4()}@example.com`,
    password: 'securepassword',
    name: 'Test User'
  };
  
  // 1. User Registration
  test('User can register', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    
    expect(response.status).toBe(201);
    expect(response.body.status).toBe('success');
    expect(response.body.data).toHaveProperty('user');
    
    userId = response.body.data.user.id;
    authToken = response.body.data.token;
  });
  
  // 2. User Login
  test('User can login', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data).toHaveProperty('token');
    
    authToken = response.body.data.token;
  });
  
  // 3. Get User Profile
  test('User can get their profile', async () => {
    const response = await request(app)
      .get('/api/user/profile')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data).toHaveProperty('user');
  });
  
  // 4. Create Wallet
  test('User can create a wallet', async () => {
    const response = await request(app)
      .post('/api/wallet')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        crypto_type: 'ETH'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.status).toBe('success');
    expect(response.body.data).toHaveProperty('address');
    
    walletAddress = response.body.data.address;
  });
  
  // 5. Get Wallet Balance
  test('User can get wallet balance', async () => {
    const response = await request(app)
      .get(`/api/wallet/${walletAddress}/balance`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data).toHaveProperty('balance');
  });
  
  // 6. Buy Crypto
  test('User can buy crypto', async () => {
    const response = await request(app)
      .post('/api/buy/payment')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        amount: '0.01',
        crypto_type: 'ETH',
        payment_method: 'card',
        email: testUser.email,
        name: testUser.name
      });
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data).toHaveProperty('transaction_id');
  });
  
  // 7. Sell Crypto
  test('User can initiate crypto sale', async () => {
    const response = await request(app)
      .post('/api/sell/crypto')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        crypto_amount: '0.0005',
        crypto_type: 'ETH',
        private_key: '0xprivatekey123',
        user_id: userId,
        bank_account: {
          account_number: '2158634852',
          account_name: 'Test User',
          bank_code: '033'
        }
      });
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data).toHaveProperty('transaction_id');
  });
  
  // 8. Transfer Crypto
  test('User can transfer crypto', async () => {
    const response = await request(app)
      .post('/api/transfer')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        from_private_key: '0xprivatekey123',
        to_address: '0x96B3e3dC445461bF3622fd4A548B22ea74239d9C',
        amount: '0.0005',
        crypto_type: 'ETH'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data).toHaveProperty('transaction_hash');
  });
  
  // 9. View Transactions
  test('User can view transaction history', async () => {
    const response = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data).toHaveProperty('transactions');
    expect(Array.isArray(response.body.data.transactions)).toBe(true);
  });
}); 