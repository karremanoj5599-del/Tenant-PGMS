require('dotenv').config();
const knex = require('knex');

const db = knex({
  client: 'pg',
  connection: {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  }
});

async function run() {
  const tables = ['tenants', 'beds', 'rooms', 'attendance_logs'];
  for (const table of tables) {
    console.log(`\n--- ${table} ---`);
    const cols = await db(table).columnInfo();
    console.log(Object.keys(cols).join(', '));
  }
  process.exit(0);
}
run();
