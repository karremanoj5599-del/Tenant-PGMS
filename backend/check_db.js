const Database = require('better-sqlite3');
const db = new Database('c:/Users/Dell/OneDrive/Desktop/PGMS/backend/dev.sqlite3');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables.map(t => t.name).join(', '));

const checkTable = (name) => {
  try {
    const info = db.prepare(`PRAGMA table_info(${name})`).all();
    console.log(`Table ${name} info:`, info.length > 0 ? 'EXISTS' : 'EMPTY');
  } catch (e) {
    console.log(`Table ${name} info: NOT FOUND`);
  }
};

['billing', 'access_logs', 'tickets', 'tenants', 'payments'].forEach(checkTable);
