const knex = require('knex');
require('dotenv').config();

const db = knex({
  client: 'pg',
  connection: {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  }
});

(async () => {
  try {
    console.log('🔄 Testing Supabase Connection...');
    const res = await db.raw('SELECT current_database(), now()');
    console.log('✅ Connection Successful:', res.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection Failed:', err.message);
    process.exit(1);
  }
})();
