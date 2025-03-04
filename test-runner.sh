#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Crypto Payment Test Runner ===${NC}"

# Check if .env.test exists
if [ ! -f .env.test ]; then
  echo -e "${RED}Error: .env.test file not found!${NC}"
  echo "Creating a sample .env.test file..."
  
  cat > .env.test << EOL
NODE_ENV=test
PORT=3000
APP_BASE_URL=http://localhost:3000
KORAPAY_CALLBACK_URL=http://localhost:3000/api/payment/webhook
KORAPAY_PUBLIC_KEY=test_pk_abcdefghijklmnopqrstuvwxyz
KORAPAY_SECRET_KEY=test_sk_abcdefghijklmnopqrstuvwxyz
COMPANY_WALLET_ADDRESS=0x742d35Cc6634C0532925a3b844Bc454e4438f44e
COMPANY_WALLET_PRIVATE_KEY=test_private_key
ALCHEMY_API_KEY=test_alchemy_key
ETHERSCAN_API_KEY=test_etherscan_key
COINMARKETCAP_API_KEY=test_coinmarketcap_key
EOL

  echo -e "${GREEN}.env.test file created. Please update with your test credentials.${NC}"
  echo "Press Enter to continue or Ctrl+C to abort..."
  read
fi

# Set environment variable to ignore TypeScript errors during test execution
export TS_NODE_TRANSPILE_ONLY=1

echo -e "${YELLOW}Running tests with TypeScript errors ignored...${NC}"
npx jest checkout.test.ts --verbose

exit_code=$?

if [ $exit_code -eq 0 ]; then
  echo -e "${GREEN}Tests completed successfully!${NC}"
else
  echo -e "${RED}Tests failed with exit code $exit_code${NC}"
fi

exit $exit_code 