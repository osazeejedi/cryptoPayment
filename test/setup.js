const dotenv = require('dotenv');
const path = require('path');

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

// Log loaded environment
console.log('Test environment loaded:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  APP_BASE_URL: process.env.APP_BASE_URL
});

// Silence console logs during tests if needed
// Uncomment the following lines to silence logs
/*
console.log = jest.fn();
console.info = jest.fn();
console.warn = jest.fn();
console.error = jest.fn();
*/ 

// Global cleanup for tests
let servers = [];

// Register a server for cleanup
global.registerServerForCleanup = (server) => {
  servers.push(server);
};

beforeAll(() => {
  // Set up test environment
});

afterAll(async () => {
  // Close any test servers
  for (const server of servers) {
    if (server && server.close) {
      await new Promise(resolve => server.close(resolve));
    }
  }
  
  // Clear any intervals or timeouts
  jest.clearAllTimers();
  
  // Wait for any lingering promises
  await new Promise(resolve => setTimeout(resolve, 500));
}); 