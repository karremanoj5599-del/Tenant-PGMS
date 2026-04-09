const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const db = new Database(process.env.DB_PATH);

try {
  const schema = db.prepare("PRAGMA table_info(tenants)").all();
  console.log('--- Tenants Table Columns ---');
  console.table(schema);
  console.log('-----------------------------');
} catch (err) {
  console.error('Error reading schema:', err);
} finally {
  db.close();
}
