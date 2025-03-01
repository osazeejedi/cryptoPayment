import dotenv from 'dotenv';
import app from './app';
import { config } from '../config/env';

// Load environment variables
dotenv.config();

// Get port from environment variables or use default
const PORT = config.server.port;

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 