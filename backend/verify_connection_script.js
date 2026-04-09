const Database = require('better-sqlite3');
const path = require('path');

const ADMIN_DB_PATH = 'c:/Users/Dell/OneDrive/Desktop/PGMS/backend/dev.sqlite3';
const db = new Database(ADMIN_DB_PATH);

console.log('--- Verification Script ---');

// 1. Check if the 'tickets' table exists in Admin DB
const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='tickets'").get();
if (!tableCheck) {
  console.error('❌ Error: "tickets" table not found in Admin database.');
  process.exit(1);
}
console.log('✅ "tickets" table found in Admin database.');

// 2. Fetch a dummy tenant from Admin DB to use for testing
const tenant = db.prepare('SELECT tenant_id, name, mobile FROM tenants LIMIT 1').get();
if (!tenant) {
  console.error('❌ Error: No tenants found in Admin database. Please add a tenant first.');
  process.exit(1);
}
console.log(`📡 Using tenant for test: ${tenant.name} (${tenant.mobile})`);

// 3. Simulate sending a ticket from the Tenant App Backend
// In a real scenario, this would be a POST /api/tickets request
console.log('🛠️ Simulating ticket submission...');
const category = 'Plumbing';
const description = 'Test ticket from consolidation verification script';
const userId = db.prepare('SELECT user_id FROM tenants WHERE tenant_id = ?').get(tenant.tenant_id)?.user_id;

const insertTicket = db.prepare(`
  INSERT INTO tickets (tenant_id, category, description, user_id, status)
  VALUES (?, ?, ?, ?, 'Pending')
`);
const result = insertTicket.run(tenant.tenant_id, category, description, userId || null);

if (result.changes > 0) {
  console.log('✅ Ticket successfully written to Admin database!');
} else {
  console.error('❌ Failed to write ticket.');
}

// 4. Verify presence
const verifiedTicket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(result.lastInsertRowid);
console.log('📄 Verified Ticket in Admin DB:', verifiedTicket);

console.log('--- Verification Complete ---');
db.close();
