/**
 * Manual test runner - allows running tests directly without Jest
 * 
 * Usage: npm run test:manual -- [test-name]
 * Example: npm run test:manual -- korapay-checkout
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Get test name from command line args
const testName = process.argv[2];

if (!testName) {
  console.log('Available manual tests:');
  // List all test files in the manual directory
  const manualTestDir = path.join(__dirname, 'manual');
  const files = fs.readdirSync(manualTestDir)
    .filter(file => file.endsWith('.ts') || file.endsWith('.js'));
  
  files.forEach(file => {
    console.log(`- ${file.replace(/\.(ts|js)$/, '')}`);
  });
  
  console.log('\nUsage: npm run test:manual -- [test-name]');
  process.exit(0);
}

// Find the test file
const manualTestDir = path.join(__dirname, 'manual');
const possibleExtensions = ['.ts', '.js'];
let testFile;

for (const ext of possibleExtensions) {
  const filePath = path.join(manualTestDir, `${testName}${ext}`);
  if (fs.existsSync(filePath)) {
    testFile = filePath;
    break;
  }
}

if (!testFile) {
  console.error(`Test "${testName}" not found. Make sure the file exists in the test/manual directory.`);
  process.exit(1);
}

// Run the test
console.log(`Running manual test: ${testName}`);
try {
  execSync(`ts-node ${testFile}`, { stdio: 'inherit' });
} catch (error) {
  console.error('Test failed with error:', error.message);
  process.exit(1);
} 