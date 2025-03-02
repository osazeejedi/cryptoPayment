import { config } from '../config/env';
import axios from 'axios';

async function checkWebhookUrl() {
  try {
    console.log('=== CHECKING WEBHOOK URL CONFIGURATION ===');
    
    const webhookUrl = config.payment.korapay.callbackUrl;
    console.log('Configured webhook URL:', webhookUrl);
    
    // Check if the URL is properly formatted
    try {
      new URL(webhookUrl);
      console.log('URL format: Valid');
    } catch (urlError) {
      console.error('URL format: Invalid');
      console.error('Please check your KORAPAY_CALLBACK_URL in the .env file.');
      return;
    }
    
    // Check if the URL contains ngrok
    const isNgrok = webhookUrl.includes('ngrok');
    console.log('Using ngrok:', isNgrok ? 'Yes' : 'No');
    
    if (isNgrok) {
      // Extract the ngrok domain
      const match = webhookUrl.match(/https:\/\/([^\/]+)/);
      if (match && match[1]) {
        const ngrokDomain = match[1];
        console.log('Ngrok domain:', ngrokDomain);
        
        // Check if the ngrok domain is accessible
        try {
          console.log(`Testing ngrok domain accessibility...`);
          const response = await axios.get(`https://${ngrokDomain}/health`, { timeout: 5000 });
          console.log('Ngrok domain is accessible:', response.status === 200 ? 'Yes' : 'No');
          console.log('Response:', response.data);
        } catch (ngrokError: any) {
          console.error('Error accessing ngrok domain:');
          if (ngrokError.response) {
            console.error('Status:', ngrokError.response.status);
            console.error('Data:', ngrokError.response.data);
          } else if (ngrokError.code === 'ECONNABORTED') {
            console.error('Connection timed out. The ngrok tunnel may not be running.');
          } else {
            console.error(ngrokError.message || ngrokError);
          }
          
          console.error('\nPossible causes:');
          console.error('1. Ngrok tunnel is not running');
          console.error('2. Ngrok domain has changed (they expire after some time)');
          console.error('3. Network connectivity issues');
          console.error('\nPlease start ngrok with "ngrok http 3000" and update your .env file with the new URL.');
        }
      }
    }
    
    // Check if the webhook endpoint exists
    try {
      console.log('\nTesting webhook endpoint existence...');
      // We'll just check if the server responds, not if the endpoint actually works
      const baseUrl = webhookUrl.substring(0, webhookUrl.lastIndexOf('/'));
      const response = await axios.get(`${baseUrl}/health`, { timeout: 5000 });
      console.log('Server is accessible:', response.status === 200 ? 'Yes' : 'No');
      console.log('Response:', response.data);
    } catch (endpointError: any) {
      console.error('Error accessing server:');
      if (endpointError.response) {
        console.error('Status:', endpointError.response.status);
        console.error('Data:', endpointError.response.data);
      } else if (endpointError.code === 'ECONNABORTED') {
        console.error('Connection timed out. The server may not be running.');
      } else {
        console.error(endpointError.message || endpointError);
      }
      
      console.error('\nPossible causes:');
      console.error('1. Your server is not running');
      console.error('2. The URL is incorrect');
      console.error('3. Network connectivity issues');
      console.error('\nPlease start your server with "npm run dev" and check your webhook URL configuration.');
    }
    
    console.log('\n=== WEBHOOK URL CHECK COMPLETED ===');
  } catch (error) {
    console.error('Error checking webhook URL:', error);
  }
}

checkWebhookUrl(); 