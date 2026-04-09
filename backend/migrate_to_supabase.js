/**
 * Data Migration: SQLite -> Supabase
 * Moves all existing records from dev.sqlite3 to the cloud.
 */

const Database = require('better-sqlite3');
const { db, dbType } = require('./db/database');
const path = require('path');

if (dbType !== 'supabase') {
  console.error('❌ Error: DB_TYPE must be "supabase" to migrate.');
  process.exit(1);
}

// 1. Local SQLite Connection
const sqlitePath = 'c:/Users/Dell/OneDrive/Desktop/PGMS/backend/dev.sqlite3';
console.log('📁 Opening Local SQLite:', sqlitePath);
const localDb = new Database(sqlitePath);

const migrateTable = async (tableName, pKey = 'id') => {
  console.log(`📦 Migrating ${tableName}...`);
  try {
    const rows = localDb.prepare(`SELECT * FROM ${tableName}`).all();
    if (rows.length === 0) {
      console.log(`ℹ️ Table ${tableName} is empty, skipping.`);
      return;
    }

    // Insert into Supabase
    // We use chunking for large datasets
    const chunkSize = 50;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      await db(tableName).insert(chunk).onConflict(pKey).ignore();
    }
    console.log(`✅ Migrated ${rows.length} rows to ${tableName}`);
  } catch (err) {
    if (err.message.includes('no such table')) {
      console.log(`⚠️ Skip: Table ${tableName} does not exist in local SQLite.`);
    } else {
      console.error(`❌ Migration failed for ${tableName}:`, err.message);
    }
  }
};

const runMigration = async () => {
  console.log('🚀 Starting Data Migration to Supabase...');

  // Order is important for foreign keys
  await migrateTable('floors', 'floor_id');
  await migrateTable('rooms', 'room_id');
  await migrateTable('beds', 'bed_id');
  await migrateTable('tenants', 'tenant_id');
  await migrateTable('payments', 'payment_id');
  await migrateTable('billing', 'id');
  await migrateTable('tickets', 'id');
  await migrateTable('access_logs', 'id');

  console.log('🏁 Migration Check Finished!');
  process.exit(0);
};

runMigration();
