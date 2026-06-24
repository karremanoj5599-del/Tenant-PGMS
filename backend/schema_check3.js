const { db } = require('./db/database');

async function run() {
  const tenants = await db('tenants').select('mobile', 'name');
  console.log('Available Tenants in Supabase DB:');
  console.log(tenants);
  process.exit(0);
}
run();
