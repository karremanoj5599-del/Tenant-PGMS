/**
 * Cloud Schema Check - Verifies actual table existence on Supabase
 */

const { db } = require('./db/database');

const checkSchema = async () => {
  try {
    console.log('🔍 Querying Supabase Information Schema...');
    
    // Check for tables in public schema
    const res = await db.raw("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    const tables = res.rows.map(r => r.table_name);
    
    console.log('📋 Current Tables on Supabase:', tables.length > 0 ? tables.join(', ') : 'NONE');
    
    if (!tables.includes('tenants')) {
      console.log('⚠️  CRITICAL: "tenants" table is MISSING! Re-running DDL...');
      // If missing, we force create it here
      await db.schema.createTable('tenants', (table) => {
        table.increments('tenant_id').primary();
        table.string('name').notNullable();
        table.string('mobile').unique().notNullable();
        table.text('password_hash');
        table.string('biometric_pin');
        table.string('access_status').defaultTo('active');
        table.date('joining_date');
        table.integer('user_id'); // Admin scoping
      });
      console.log('✅ "tenants" table created successfully.');
    } else {
      console.log('✅ "tenants" table exists.');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Cloud Check Failed:', err.message);
    process.exit(1);
  }
};

checkSchema();
