const { db } = require('./db/database');

async function run() {
  const cols = await db('tenants').columnInfo();
  console.log(cols.tenant_id);
  process.exit(0);
}
run();
