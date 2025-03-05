import dotenv from 'dotenv';
import { jest } from '@jest/globals';
import { Request, Response } from 'express';

// Load environment variables from .env.test file
dotenv.config({ path: '.env.test' });

// Set test timeout
jest.setTimeout(30000);

// Mock Supabase - fix the path
jest.mock('../config/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn().mockImplementation(() => Promise.resolve({
        data: { 
          user: { id: 'test-user-id', email: 'test@example.com' }, 
          session: { access_token: 'test-token' } 
        },
        error: null
      })),
      signInWithPassword: jest.fn().mockImplementation(() => Promise.resolve({
        data: { 
          user: { id: 'test-user-id', email: 'test@example.com' }, 
          session: { access_token: 'test-token' } 
        },
        error: null
      })),
      getUser: jest.fn().mockImplementation(() => Promise.resolve({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null
      }))
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockImplementation(() => Promise.resolve({
        data: { 
          id: 'test-id', 
          address: '0x123456789',
          user_id: 'test-user-id',
          email: 'test@example.com',
          full_name: 'Test User'
        },
        error: null
      }))
    })
  }
}));

// Mock BlockchainService
jest.mock('../src/services/blockchainService', () => ({
  BlockchainService: {
    isValidAddress: jest.fn().mockImplementation(() => true),
    transferCrypto: jest.fn().mockImplementation(() => Promise.resolve('0xmocktxhash123')),
    verifyTransaction: jest.fn().mockImplementation(() => Promise.resolve(true)),
    getAddressFromPrivateKey: jest.fn().mockImplementation(() => '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'),
    transferFromUserToCompany: jest.fn().mockImplementation(() => Promise.resolve('0xmocktxhash123')),
    processBuyRequest: jest.fn().mockImplementation(() => Promise.resolve('0xmocktxhash123')),
    getBalance: jest.fn().mockImplementation(() => Promise.resolve('0.001')),
    sendCrypto: jest.fn().mockImplementation(() => Promise.resolve('0xmocktxhash123')),
    getTransferFee: jest.fn().mockImplementation(() => Promise.resolve('0.0001')),
    createWallet: jest.fn().mockImplementation(() => Promise.resolve({
      address: '0x123456789',
      privateKey: '0xprivatekey123'
    }))
  }
}));

// Mock DatabaseService
jest.mock('../src/services/databaseService', () => ({
  DatabaseService: {
    getUserById: jest.fn().mockImplementation(() => Promise.resolve({ 
      id: 'test-user-id', 
      email: 'test@example.com',
      full_name: 'Test User'
    })),
    getUserProfile: jest.fn().mockImplementation(() => Promise.resolve({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        full_name: 'Test User'
      },
      wallets: [
        { id: 'wallet-1', address: '0x123456789', crypto_type: 'ETH' }
      ]
    })),
    getUserTransactions: jest.fn().mockImplementation(() => Promise.resolve([
      { id: 'tx1', type: 'buy', amount: '0.1', status: 'completed' },
      { id: 'tx2', type: 'sell', amount: '0.05', status: 'completed' }
    ])),
    getTransaction: jest.fn().mockImplementation(() => Promise.resolve({
      id: 'tx1',
      user_id: 'test-user-id',
      type: 'buy',
      amount: '0.1',
      status: 'completed'
    })),
    createTransaction: jest.fn().mockImplementation((_data) => Promise.resolve({
      id: 'test-tx-123',
      user_id: 'test-user-id',
      amount: '0.1',
      status: 'completed',
      createdAt: new Date(),
      updatedAt: new Date()
    })),
    createWallet: jest.fn().mockImplementation(() => Promise.resolve({
      id: 'wallet-1',
      address: '0x123456789',
      crypto_type: 'ETH',
      user_id: 'test-user-id'
    }))
  }
}));

// Mock for BuyController
jest.mock('../src/controllers/buyController', () => ({
  BuyController: {
    createPayment: jest.fn().mockImplementation((req: any, res: any) => {
      // Always return 200 for tests
      res.status(200).json({
        status: 'success',
        data: {
          transaction_id: 'test-tx-123',
          amount: req.body.amount,
          crypto_type: req.body.crypto_type,
          payment_method: req.body.payment_method,
          status: 'pending'
        }
      });
      return Promise.resolve(); // Return a promise to satisfy .catch()
    }),
    verifyPayment: jest.fn().mockImplementation((req: any, res: any) => {
      res.status(200).json({
        status: 'success',
        data: {
          transaction_id: req.params.transaction_id,
          status: 'completed',
          amount: '0.1',
          crypto_type: 'ETH',
          created_at: new Date().toISOString()
        }
      });
      return Promise.resolve();
    }),
    createBuyOrder: jest.fn().mockImplementation((req: any, res: any) => {
      res.status(200).json({
        status: 'success',
        data: {
          transaction_id: 'test-tx-123',
          amount: req.body.amount,
          crypto_type: req.body.crypto_type,
          status: 'pending'
        }
      });
      return Promise.resolve();
    })
  }
}));

// Mock for SellController
jest.mock('../src/controllers/sellController', () => ({
  SellController: {
    sellRequest: jest.fn().mockImplementation((req: any, res: any) => {
      res.status(200).json({
        status: 'success',
        data: {
          transaction_id: 'test-tx-123',
          amount: req.body.crypto_amount,
          crypto_type: req.body.crypto_type,
          status: 'pending'
        }
      });
    }),
    getBanks: jest.fn().mockImplementation((_req: any, res: any) => {
      res.status(200).json({
        status: 'success',
        data: {
          banks: [
            { code: '033', name: 'United Bank for Africa' },
            { code: '058', name: 'Guaranty Trust Bank' }
          ]
        }
      });
    }),
    verifyBankAccount: jest.fn().mockImplementation((req: any, res: any) => {
      res.status(200).json({
        status: 'success',
        data: {
          account_name: 'Test User',
          account_number: req.body.account_number,
          bank_code: req.body.bank_code
        }
      });
    }),
    verifySellTransaction: jest.fn().mockImplementation((req: any, res: any) => {
      res.status(200).json({
        status: 'success',
        data: {
          transaction_id: req.params.transaction_id,
          status: 'completed',
          amount: '0.1',
          crypto_type: 'ETH',
          created_at: new Date().toISOString()
        }
      });
    })
  }
}));

// Mock for WalletController
jest.mock('../src/controllers/walletController', () => ({
  WalletController: {
    createWallet: jest.fn().mockImplementation((req: any, res: any) => {
      res.status(201).json({
        status: 'success',
        data: {
          id: 'wallet-1',
          address: '0x123456789',
          crypto_type: req.body.crypto_type
        }
      });
    }),
    getWalletBalance: jest.fn().mockImplementation((req: any, res: any) => {
      res.status(200).json({
        status: 'success',
        data: {
          address: req.params.address,
          crypto_type: req.query.crypto_type,
          balance: '0.001'
        }
      });
    })
  }
})); 