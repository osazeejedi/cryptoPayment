import axios from 'axios';

async function checkServer() {
  try {
    console.log('Checking if server is running...');
    
    // Check health endpoint
    const healthResponse = await axios.get('http://localhost:3000/health');
    console.log('Health endpoint response:', healthResponse.status, healthResponse.data);
    
    // List all available routes
    console.log('\nTesting available routes:');
    
    const routes = [
      { method: 'GET', url: '/health' },
      { method: 'GET', url: '/debug/test' },
      { method: 'POST', url: '/debug/log' },
      { method: 'GET', url: '/api/payment/success' }
    ];
    
    for (const route of routes) {
      try {
        let response;
        if (route.method === 'GET') {
          response = await axios.get(`http://localhost:3000${route.url}`);
        } else {
          response = await axios.post(`http://localhost:3000${route.url}`, { test: true });
        }
        console.log(`${route.method} ${route.url}: ${response.status}`);
      } catch (routeError) {
        if (axios.isAxiosError(routeError)) {
          console.log(`${route.method} ${route.url}: ${routeError.response?.status || 'Error'}`);
        } else {
          console.log(`${route.method} ${route.url}: Error`);
        }
      }
    }
    
    console.log('\nServer check completed.');
  } catch (error) {
    console.error('Error checking server:');
    if (axios.isAxiosError(error)) {
      console.error('Status:', error.response?.status);
      console.error('Data:', error.response?.data);
    } else {
      console.error('Error:', error);
    }
    console.error('\nThe server may not be running. Start it with "npm run dev".');
  }
}

checkServer(); 