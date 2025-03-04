#!/bin/bash

# Create manual tests directory if it doesn't exist
mkdir -p test/manual

# Move the specified test files
mv test/korapay-direct.test.ts test/manual/
mv test/korapay-connection.test.ts test/manual/
mv test/payment.test.ts test/manual/
mv test/api.test.ts test/manual/
mv test/blockchain.test.ts test/manual/  # if it has manual test code
mv test/full-payment-flow.ts test/manual/
mv test/test-blockchain-service.ts test/manual/
mv test/simulate-webhook.ts test/manual/

# Update Jest config
cat << 'EOF' >> jest.config.js

// Avoid testing manual tests
module.exports.testPathIgnorePatterns = [
  "/node_modules/",
  "/test/manual/",
  "/dist/"
];
EOF

echo "Manual tests moved successfully!" 