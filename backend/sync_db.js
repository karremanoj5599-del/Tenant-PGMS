const Database = require('better-sqlite3');
const db = new Database('c:/Users/Dell/OneDrive/Desktop/PGMS/backend/dev.sqlite3');

console.log('🛠️ Synchronizing Database Schema...');

// 1. Update payments table
try {
  db.prepare("ALTER TABLE payments ADD COLUMN payment_via TEXT DEFAULT 'Cash'").run();
  console.log('✅ Added payment_via to payments');
} catch (e) { console.log('ℹ️ payment_via already exists'); }

try {
  db.prepare("ALTER TABLE payments ADD COLUMN utr_number TEXT").run();
  console.log('✅ Added utr_number to payments');
} catch (e) { console.log('ℹ️ utr_number already exists'); }

try {
  db.prepare("ALTER TABLE payments ADD COLUMN user_id INTEGER").run();
  console.log('✅ Added user_id to payments (mapping to admin)');
} catch (e) { console.log('ℹ️ user_id already exists'); }

// 2. Ensure billing and other tables exist with correct columns if not present
db.exec(`
  CREATE TABLE IF NOT EXISTS billing (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER,
    month TEXT,
    year INTEGER,
    fixed_rent FLOAT,
    previous_balance FLOAT DEFAULT 0,
    total_due FLOAT,
    amount_paid FLOAT DEFAULT 0,
    current_balance FLOAT,
    due_date DATE,
    user_id INTEGER
  );

  CREATE TABLE IF NOT EXISTS access_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER,
    punch_type TEXT,
    punch_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    device_name TEXT,
    user_id INTEGER
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER,
    category TEXT,
    description TEXT,
    status TEXT DEFAULT 'open',
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER
  );
`);

console.log('🚀 Database Schema Unified!');
