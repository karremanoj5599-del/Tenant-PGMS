/**
 * Supabase Schema Bootstrap
 * Creates all tables required for PGMS and Tenant-PGMS on Supabase.
 */

const { db, dbType } = require('./db/database');

if (dbType !== 'supabase') {
  console.error('❌ Error: DB_TYPE is not set to "supabase" in .env');
  process.exit(1);
}

const setupSchema = async () => {
  console.log('🚀 Starting Supabase Schema Setup...');

  try {
    // 1. Drop and Create Tables In Order
    // (We use ifNotExists to avoid data loss)
    
    console.log('--- Creating Reference Tables ---');
    
    await db.schema.hasTable('floors').then(exists => {
      if (!exists) return db.schema.createTable('floors', t => {
        t.increments('floor_id').primary();
        t.string('floor_name').notNullable();
      });
    });

    await db.schema.hasTable('rooms').then(exists => {
      if (!exists) return db.schema.createTable('rooms', t => {
        t.increments('room_id').primary();
        t.integer('floor_id').references('floor_id').inTable('floors');
        t.string('room_number').notNullable();
        t.integer('sharing_capacity');
        t.integer('user_id');
      });
    });

    await db.schema.hasTable('beds').then(exists => {
      if (!exists) return db.schema.createTable('beds', t => {
        t.increments('bed_id').primary();
        t.integer('room_id').references('room_id').inTable('rooms');
        t.string('bed_number').notNullable();
        t.float('bed_cost');
        t.string('status').defaultTo('Vacant');
        t.integer('user_id');
      });
    });

    console.log('--- Creating Main Tables ---');

    await db.schema.hasTable('tenants').then(exists => {
      if (!exists) return db.schema.createTable('tenants', t => {
        t.increments('tenant_id').primary();
        t.integer('bed_id').references('bed_id').inTable('beds');
        t.string('name').notNullable();
        t.string('mobile').notNullable();
        t.string('password_hash');
        t.string('biometric_pin');
        t.string('joining_date');
        t.string('expiry_date');
        t.string('access_status').defaultTo('pending'); // pending/active/expired
        t.integer('user_id');
      });
    });

    await db.schema.hasTable('payments').then(exists => {
      if (!exists) return db.schema.createTable('payments', t => {
        t.increments('payment_id').primary();
        t.integer('tenant_id').references('tenant_id').inTable('tenants');
        t.float('amount_paid').notNullable();
        t.string('payment_date');
        t.string('payment_via').defaultTo('UPI');
        t.string('utr_number');
        t.string('payment_type').defaultTo('Rent');
        t.integer('user_id');
      });
    });

    await db.schema.hasTable('billing').then(exists => {
      if (!exists) return db.schema.createTable('billing', t => {
        t.increments('id').primary();
        t.integer('tenant_id').references('tenant_id').inTable('tenants');
        t.string('month');
        t.integer('year');
        t.float('fixed_rent');
        t.float('previous_balance').defaultTo(0);
        t.float('total_due');
        t.float('amount_paid').defaultTo(0);
        t.float('current_balance');
        t.string('due_date');
        t.integer('user_id');
      });
    });

    await db.schema.hasTable('access_logs').then(exists => {
      if (!exists) return db.schema.createTable('access_logs', t => {
        t.increments('id').primary();
        t.integer('tenant_id').references('tenant_id').inTable('tenants');
        t.string('punch_type');
        t.timestamp('punch_time').defaultTo(db.fn.now());
        t.string('device_name');
        t.integer('user_id');
      });
    });

    await db.schema.hasTable('tickets').then(exists => {
      if (!exists) return db.schema.createTable('tickets', t => {
        t.increments('id').primary();
        t.integer('tenant_id').references('tenant_id').inTable('tenants');
        t.string('category');
        t.text('description');
        t.string('status').defaultTo('open');
        t.text('admin_notes');
        t.timestamps(true, true);
        t.integer('user_id');
      });
    });

    console.log('✅ Supabase Schema Setup Completed Successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Schema Setup Failed:', err.message);
    process.exit(1);
  }
};

setupSchema();
