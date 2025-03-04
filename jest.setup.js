// Add to the top of your existing jest.setup.js file
jest.setTimeout(60000); // Increase timeout for slower tests

// Ensure mocks are properly registered
beforeAll(() => {
  // Clear all mocks before tests
  jest.clearAllMocks();
});

// Add timeout cleanup to prevent connection leaks
afterAll(async () => {
  await new Promise(resolve => setTimeout(resolve, 1000));
});

// Mock the blockchain service
jest.mock('./src/services/blockchainService', () => ({
  BlockchainService: {
    isValidAddress: jest.fn().mockReturnValue(true),
    transferCrypto: jest.fn().mockResolvedValue('0xmocktxhash123'),
    verifyTransaction: jest.fn().mockResolvedValue(true),
    getAddressFromPrivateKey: jest.fn().mockReturnValue('0x742d35Cc6634C0532925a3b844Bc454e4438f44e'),
    transferFromUserToCompany: jest.fn().mockResolvedValue('0xmocktxhash123'),
    processBuyRequest: jest.fn().mockResolvedValue('0xmocktxhash123'),
    getEthersProvider: jest.fn().mockReturnValue({
      getNetwork: jest.fn().mockResolvedValue({ name: 'sepolia', chainId: 11155111 }),
      getBalance: jest.fn().mockResolvedValue(100000000000000n)
    }),
    estimateGas: jest.fn().mockResolvedValue('0.000021'),
    getTokenContract: jest.fn().mockReturnValue({
      target: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607'
    }),
    getSwapEstimate: jest.fn().mockResolvedValue('30.5')
  }
}));

// Mock Database Service
jest.mock('./src/services/databaseService', () => ({
  DatabaseService: {
    getUserById: jest.fn().mockResolvedValue({ id: 'test-user-id', email: 'test@example.com' }),
    getUserByEmail: jest.fn().mockResolvedValue({ id: 'test-user-id', email: 'test@example.com' }),
    createUser: jest.fn().mockResolvedValue({ id: 'test-user-id', email: 'test@example.com' }),
    createTransaction: jest.fn().mockImplementation((data) => Promise.resolve({
      id: 'test-tx-123',
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    })),
    updateTransaction: jest.fn().mockImplementation((id, data) => Promise.resolve({
      id,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    })),
    getTransaction: jest.fn().mockResolvedValue({
      id: 'test-tx-123',
      amount: '0.1',
      cryptoAmount: '0.1',
      cryptoType: 'ETH',
      walletAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      status: 'pending',
      paymentMethod: 'card',
      createdAt: new Date(),
      updatedAt: new Date()
    }),
    getTransactionByReference: jest.fn().mockResolvedValue({
      id: 'test-tx-123',
      amount: '0.1',
      cryptoAmount: '0.1',
      cryptoType: 'ETH',
      walletAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      status: 'pending',
      paymentMethod: 'card',
      createdAt: new Date(),
      updatedAt: new Date()
    }),
    getTransactionsByStatus: jest.fn().mockResolvedValue([])
  }
}));

// Mock Korapay Service
jest.mock('./src/services/korapayService', () => ({
  KorapayService: {
    initializePayment: jest.fn().mockResolvedValue({
      reference: 'test-ref-123',
      checkoutUrl: 'https://checkout.korapay.com/test',
      checkout_url: 'https://checkout.korapay.com/test'
    }),
    verifyPayment: jest.fn().mockResolvedValue({
      status: 'success',
      reference: 'test-ref-123'
    }),
    processCardPayment: jest.fn().mockResolvedValue({
      status: 'success',
      reference: 'test-ref-123'
    }),
    verifyWebhook: jest.fn().mockReturnValue(true),
    processBankPayout: jest.fn().mockResolvedValue({
      reference: 'payout-ref-123',
      status: 'success'
    }),
    checkPayoutStatus: jest.fn().mockResolvedValue({
      status: 'success'
    }),
    verifyBankAccount: jest.fn().mockResolvedValue({
      account_name: 'Test Account',
      account_number: '1234567890'
    }),
    getBanks: jest.fn().mockResolvedValue([
      { name: 'Test Bank', code: '123' }
    ])
  }
}));

// Mock Price Service
jest.mock('./src/services/priceService', () => ({
  PriceService: {
    getCurrentPrice: jest.fn().mockResolvedValue(3000),
    convertNairaToCrypto: jest.fn().mockResolvedValue('0.01')
  }
}));

// Mock Transaction Verification Service
jest.mock('./src/services/transactionVerificationService', () => ({
  TransactionVerificationService: {
    verifyTransaction: jest.fn().mockResolvedValue(true)
  }
}));

// Mock other services similarly 