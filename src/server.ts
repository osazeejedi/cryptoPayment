import dotenv from 'dotenv';
import app from './app';
import { config } from '../config/env';
import { recoverPendingTransactions } from './jobs/transactionRecoveryJob';
import authRoutes from './routes/authRoutes';

// Load environment variables
dotenv.config();

// Get port from environment variables or use default
const PORT = config.server.port || 3000;

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${config.app.env}`);
  console.log(`Base URL: ${config.app.baseUrl}`);
  console.log(`Korapay callback URL: ${config.payment.korapay.callbackUrl}`);
});

// Schedule transaction recovery job to run every 10 minutes
setInterval(recoverPendingTransactions, 10 * 60 * 1000); 