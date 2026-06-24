const express = require('express');
const { db, dbType } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/notifications
 * Retrieves all notifications for the logged-in tenant
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.tenant.tenant_id;

    let notifications = [];
    if (dbType === 'supabase') {
      notifications = await db('notifications')
        .where('tenant_id', tenantId)
        .orderBy('created_at', 'desc')
        .limit(50);
    } else {
      notifications = db.prepare(`
        SELECT * FROM notifications 
        WHERE tenant_id = ? 
        ORDER BY created_at DESC 
        LIMIT 50
      `).all(tenantId);
    }

    res.json(notifications);
  } catch (err) {
    console.error('Fetch notifications error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark a notification as read
 */
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.tenant.tenant_id;
    const { id } = req.params;

    if (dbType === 'supabase') {
      await db('notifications')
        .where({ id, tenant_id: tenantId })
        .update({ is_read: true });
    } else {
      db.prepare(`
        UPDATE notifications 
        SET is_read = 1 
        WHERE id = ? AND tenant_id = ?
      `).run(id, tenantId);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
