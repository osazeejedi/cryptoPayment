// Load environment variables if .env exists, but don't fail if it doesn't
try {
  require('dotenv').config();
} catch (err) {
  console.log('No .env file found, using environment variables from Render');
}

// Then require the server
require('./dist/src/server'); 