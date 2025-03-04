module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./jest.setup.js', './test/setup.js'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverage: false,
  verbose: true,
  forceExit: true, // Force Jest to exit after all tests complete
  detectOpenHandles: true, // Help identify open handles preventing Jest from exiting
  testTimeout: 30000, // Increase timeout if needed
}; 