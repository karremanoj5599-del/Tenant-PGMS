/**
 * Auth Middleware - Validates x-tenant-id header
 */

const { db, dbType } = require('../db/database');

const authMiddleware = async (req, res, next) => {
  try {
    const tenantId = req.headers['x-tenant-id'];

    if (!tenantId) {
      return res.status(401).json({ error: 'Authentication required. Missing x-tenant-id header.' });
    }

    // Safety for stale JWT tokens (Legacy migration)
    if (tenantId.length > 50) {
      return res.status(401).json({ error: 'Auth failed. Please sign out and sign in again.' });
    }

    // Identify tenant from Header (using our unified Knex connection)
    let tenant;
    if (dbType === 'supabase') {
      tenant = await db('tenants').where('tenant_id', tenantId).first();
    } else {
      tenant = db.prepare('SELECT * FROM tenants WHERE tenant_id = ?').get(tenantId);
    }

    if (!tenant) {
      return res.status(401).json({ error: 'Invalid tenant authentication.' });
    }

    // Attach tenant details to request
    req.tenant = tenant;
    next();
  } catch (err) {
    console.error('Middleware Error:', err);
    res.status(500).json({ error: 'Authentication processing failed.' });
  }
};

module.exports = { authMiddleware };
