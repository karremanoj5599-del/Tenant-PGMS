/**
 * Access Log Routes - Biometric history
 */

const express = require('express');
const { db, dbType } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/logs
 * Returns tenant's biometric access history
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.tenant.tenant_id;

    let logs;
    if (dbType === 'supabase') {
      logs = await db('attendance_logs')
        .where('tenant_id', tenantId.toString())
        .orderBy('punch_time', 'desc')
        .limit(50);
    } else {
      logs = db.prepare('SELECT * FROM attendance_logs WHERE tenant_id = ? ORDER BY punch_time DESC LIMIT 50').all(tenantId.toString());
    }

    res.json({
      success: true,
      logs: logs.map(log => ({
        id: log.log_id || log.id,
        type: log.status === 0 ? 'Entry' : 'Exit',
        time: log.punch_time,
        location: log.device_sn || 'Main Gate'
      }))
    });
  } catch (err) {
    console.error('Fetch logs error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
