// Health check script for Docker
const http = require('http');

const options = {
  hostname: '127.0.0.1',
  port: process.env.PORT || 5000,
  path: '/health',
  method: 'GET',
  timeout: 3000
};

console.log(`Health check: http://${options.hostname}:${options.port}${options.path}`);

const req = http.request(options, (res) => {
  console.log(`Health check response: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('Health check passed');
      process.exit(0);
    } else {
      console.log(`Health check failed with status: ${res.statusCode}`);
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.log(`Health check error: ${err.message}`);
  process.exit(1);
});

req.on('timeout', () => {
  console.log('Health check timeout');
  req.destroy();
  process.exit(1);
});

req.setTimeout(3000);
req.end();
