const net = require('net');

// Function to find an available port
async function findAvailablePort(startPort = 3001) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => {
        resolve(port);
      });
    });
    
    server.on('error', () => {
      // If port is in use, try the next one
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

module.exports = {
  findAvailablePort
}; 