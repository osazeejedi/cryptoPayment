module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  collectCoverage: false,
  verbose: true,
  forceExit: true, // Force Jest to exit after all tests complete
  detectOpenHandles: true, // Help identify open handles preventing Jest from exiting
  testTimeout: 30000, // Increase timeout if needed
}; 