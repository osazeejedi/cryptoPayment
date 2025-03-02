import axios from 'axios';
import { config } from '../config/env';

async function verifyKorapayApi() {
  try {
    console.log('=== VERIFYING KORAPAY API CONNECTIVITY ===');
    
    // Check if API keys are configured
    const publicKey = config.payment.korapay.publicKey;
    const secretKey = config.payment.korapay.secretKey;
    
    console.log('Public Key:', publicKey ? `${publicKey.substring(0, 10)}...` : 'Not configured');
    console.log('Secret Key:', secretKey ? `${secretKey.substring(0, 10)}...` : 'Not configured');
    
    if (!publicKey || !secretKey) {
      console.error('Korapay API keys are not properly configured. Please check your .env file.');
      return;
    }
    
    // Test the API with a simple request
    console.log('\nTesting Korapay API connectivity...');
    
    try {
      const response = await axios.get(
        'https://api.korapay.com/merchant/api/v1/charges/banks',
        {
          headers: {
            'Authorization': `Bearer ${secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.status === 200 && response.data.status) {
        console.log('Korapay API connection successful!');
        console.log(`Retrieved ${response.data.data.length} banks.`);
        console.log('Sample banks:');
        response.data.data.slice(0, 3).forEach((bank: any) => {
          console.log(`- ${bank.name} (${bank.code})`);
        });
      } else {
        console.error('Korapay API returned an unexpected response:');
        console.error(response.data);
      }
    } catch (apiError: any) {
      console.error('Error connecting to Korapay API:');
      if (apiError.response) {
        console.error('Status:', apiError.response.status);
        console.error('Data:', apiError.response.data);
      } else {
        console.error(apiError.message || apiError);
      }
      
      console.error('\nPossible causes:');
      console.error('1. Invalid API keys');
      console.error('2. Network connectivity issues');
      console.error('3. Korapay API service is down');
      console.error('\nPlease check your API keys and try again.');
    }
    
    console.log('\n=== KORAPAY API VERIFICATION COMPLETED ===');
  } catch (error) {
    console.error('Error verifying Korapay API:', error);
  }
}

verifyKorapayApi(); 