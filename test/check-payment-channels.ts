import axios from 'axios';
import { config } from '../config/env';

async function checkPaymentChannels() {
  try {
    console.log('=== CHECKING AVAILABLE PAYMENT CHANNELS ===');
    
    // Check if API keys are configured
    const secretKey = config.payment.korapay.secretKey;
    
    if (!secretKey) {
      console.error('Korapay API secret key is not configured. Please check your .env file.');
      return;
    }
    
    // Test the API with a simple request
    console.log('\nFetching available payment channels...');
    
    try {
      const response = await axios.get(
        'https://api.korapay.com/merchant/api/v1/charges/channels',
        {
          headers: {
            'Authorization': `Bearer ${secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.status === 200 && response.data.status) {
        console.log('Successfully retrieved payment channels!');
        
        const channels = response.data.data;
        console.log(`\nAvailable payment channels (${channels.length}):`);
        
        channels.forEach((channel: any) => {
          console.log(`- ${channel.name} (${channel.channel_code})`);
        });
        
        // Check if mobile_money is available
        const mobileMoney = channels.find((channel: any) => channel.channel_code === 'mobile_money');
        if (mobileMoney) {
          console.log('\nMobile Money is available as a payment channel!');
        } else {
          console.log('\nMobile Money is NOT available as a payment channel.');
          console.log('You may need to contact Korapay to enable this feature for your account.');
        }
      } else {
        console.error('Korapay API returned an unexpected response:');
        console.error(response.data);
      }
    } catch (apiError: any) {
      console.error('Error fetching payment channels:');
      if (apiError.response) {
        console.error('Status:', apiError.response.status);
        console.error('Data:', apiError.response.data);
      } else {
        console.error(apiError.message || apiError);
      }
    }
    
    console.log('\n=== PAYMENT CHANNELS CHECK COMPLETED ===');
  } catch (error) {
    console.error('Error checking payment channels:', error);
  }
}

checkPaymentChannels(); 