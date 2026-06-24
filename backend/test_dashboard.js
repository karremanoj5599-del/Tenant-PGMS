const http = require('http');
const { db } = require('./db/database');

async function test() {
  const tenant = await db('tenants').where({ mobile: '8106082914' }).first();
  console.log('Demo Tenant:', tenant);

  if (tenant) {
    const req = http.get('http://127.0.0.1:3001/api/dashboard/overview', {
      headers: { 'x-tenant-id': tenant.tenant_id }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Body: ${data}`);
        process.exit(0);
      });
    });
    req.on('error', (e) => {
      console.error(`Request error: ${e.message}`);
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
}
test();
