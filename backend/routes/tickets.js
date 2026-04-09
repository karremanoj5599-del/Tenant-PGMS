/**
 * Support Ticket Routes
 */

const express = require('express');
const { db, dbType } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/tickets
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.tenant.tenant_id;

    let tickets;
    if (dbType === 'supabase') {
      tickets = await db('tickets')
        .where('tenant_id', tenantId)
        .orderBy('created_at', 'desc');
    } else {
      tickets = db.prepare('SELECT * FROM tickets WHERE tenant_id = ? ORDER BY created_at DESC').all(tenantId);
    }

    res.json({ success: true, tickets });
  } catch (err) {
    console.error('Fetch tickets error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * POST /api/tickets/create
 */
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.tenant.tenant_id;
    const { category, description } = req.body;

    if (!category || !description) {
      return res.status(400).json({ error: 'Category and description are required.' });
    }

    // Get Admin User ID for scoping
    let tenant;
    if (dbType === 'supabase') {
      tenant = await db('tenants').select('user_id').where('tenant_id', tenantId).first();
    } else {
      tenant = db.prepare('SELECT user_id FROM tenants WHERE tenant_id = ?').get(tenantId);
    }
    const adminUserId = tenant ? tenant.user_id : null;

    let ticketId;
    if (dbType === 'supabase') {
      const [newTicket] = await db('tickets').insert({
        tenant_id: tenantId,
        category,
        description,
        status: 'Open',
        user_id: adminUserId
      }).returning('id');
      ticketId = newTicket.id;
    } else {
      const result = db.prepare(`
        INSERT INTO tickets (tenant_id, category, description, status, user_id)
        VALUES (?, ?, ?, 'Open', ?)
      `).run(tenantId, category, description, adminUserId);
      ticketId = result.lastInsertRowid;
    }

    res.json({ success: true, message: 'Ticket created successfully.', ticketId });
  } catch (err) {
    console.error('Create ticket error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
