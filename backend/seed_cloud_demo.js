/**
 * Cloud Seeding - Re-creates the Demo Tenant on Supabase
 */

const bcrypt = require('bcryptjs');
const { db, dbType } = require('./db/database');

if (dbType !== 'supabase') {
  console.error('❌ Error: DB_TYPE must be "supabase" to seed the cloud.');
  process.exit(1);
}

const seedDemo = async () => {
  try {
    console.log('🔄 Seeding Demo Credentials to Supabase...');
    const hashedPassword = await bcrypt.hash('1234', 10);
    
    // We try to upsert the demo tenant
    const existing = await db('tenants').where('mobile', '+919876543210').first();
    if (existing) {
      await db('tenants').where('mobile', '+919876543210').update({
        name: 'Demo Tenant',
        password_hash: hashedPassword,
        biometric_pin: '1234',
        access_status: 'active',
        joining_date: '2026-03-31'
      });
      console.log('✅ Demo Tenant [+919876543210] updated on Supabase!');
    } else {
      await db('tenants').insert({
        name: 'Demo Tenant',
        mobile: '+919876543210',
        password_hash: hashedPassword,
        biometric_pin: '1234',
        access_status: 'active',
        joining_date: '2026-03-31'
      });
      console.log('✅ Demo Tenant [+919876543210] is now LIVE on Supabase!');
    }
    
    // Check if the user mentioned 'karre' also needs to be seeded
    // (Optional: We could seed common test users here)
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed Failed:', err.message);
    process.exit(1);
  }
};

seedDemo();
