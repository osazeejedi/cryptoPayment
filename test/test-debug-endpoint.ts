import axios from 'axios';

async function testDebugEndpoint() {
  try {
    console.log('=== TESTING DEBUG ENDPOINTS ===');
    
    // Test the simple test endpoint first
    console.log('\nTesting simple test endpoint...');
    try {
      const testResponse = await axios.get('http://localhost:3000/debug/test');
      console.log('Test endpoint response:', testResponse.status, testResponse.data);
    } catch (testError) {
      console.error('Error testing simple endpoint:');
      if (axios.isAxiosError(testError)) {
        console.error('Status:', testError.response?.status);
        console.error('Data:', testError.response?.data);
      } else {
        console.error('Error:', testError);
      }
      console.error('\nThe debug routes may not be properly registered. Check your app.ts file.');
      return;
    }
    
    // If the test endpoint works, try the log endpoint
    console.log('\nTesting log endpoint...');
    const localResponse = await axios.post(
      'http://localhost:3000/debug/log',
      { test: 'data', timestamp: new Date().toISOString() },
      { headers: { 'X-Test-Header': 'test-value' } }
    );
    
    console.log('Log endpoint response:', localResponse.status, localResponse.data);
    
    // Test with ngrok if the local endpoint works
    if (localResponse.status === 200) {
      console.log('\nTesting ngrok URL...');
      const ngrokUrl = process.env.NGROK_URL || 'https://ae85-105-112-228-150.ngrok-free.app';
      console.log('Using ngrok URL:', `${ngrokUrl}/debug/log`);
      
      const ngrokResponse = await axios.post(
        `${ngrokUrl}/debug/log`,
        { test: 'data', timestamp: new Date().toISOString() },
        { headers: { 'X-Test-Header': 'test-value' } }
      );
      
      console.log('Ngrok response:', ngrokResponse.status, ngrokResponse.data);
    }
    
    console.log('\n=== DEBUG ENDPOINT TEST COMPLETED ===');
  } catch (error) {
    console.error('Error testing debug endpoint:');
    if (axios.isAxiosError(error)) {
      console.error('Status:', error.response?.status);
      console.error('Data:', error.response?.data);
    } else {
      console.error('Error:', error);
    }
  }
}

testDebugEndpoint(); 