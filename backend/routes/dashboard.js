/**
 * Dashboard Routes - Home screen data (Profile + Overview)
 */

const express = require('express');
const { db, dbType } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/dashboard/overview
 * Fetches tenant's profile, room details, and recent activity
 */
router.get('/overview', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.tenant.tenant_id;

    // 1. Get Tenant details with Profile Join
    let tenantProfile;
    if (dbType === 'supabase') {
      tenantProfile = await db('tenants')
        .leftJoin('beds', 'tenants.bed_id', 'beds.bed_id')
        .leftJoin('rooms', 'beds.room_id', 'rooms.room_id')
        .where('tenants.tenant_id', tenantId)
        .select('tenants.*', 'beds.bed_number', 'rooms.room_number')
        .first();
    } else {
      tenantProfile = db.prepare(`
        SELECT t.*, b.bed_number, r.room_number 
        FROM tenants t
        LEFT JOIN beds b ON t.bed_id = b.bed_id
        LEFT JOIN rooms r ON b.room_id = r.room_id
        WHERE t.tenant_id = ?
      `).get(tenantId);
    }

    if (!tenantProfile) {
      return res.status(404).json({ error: 'Tenant record not found.' });
    }

    // 2. Get Recent Attendance Logs (Latest 3)
    // Note: PGMS uses 'attendance_logs' table, not 'access_logs'
    let recentLogs;
    if (dbType === 'supabase') {
      recentLogs = await db('attendance_logs')
        .where('tenant_id', tenantId.toString()) // or biometric_pin depending on what is stored
        .orderBy('punch_time', 'desc')
        .limit(3);
    } else {
      recentLogs = db.prepare(`
        SELECT * FROM attendance_logs 
        WHERE tenant_id = ? 
        ORDER BY punch_time DESC 
        LIMIT 3
      `).all(tenantId.toString());
    }

    res.json({
      success: true,
      tenant: {
        name: tenantProfile.name,
        mobile: tenantProfile.mobile,
        room_number: tenantProfile.room_number || 'N/A',
        bed_number: tenantProfile.bed_number || 'N/A',
        joining_date: tenantProfile.joining_date,
        access_status: tenantProfile.access_status || 'active',
      },
      recentActivity: recentLogs.map(log => ({
        id: log.log_id || log.id,
        type: log.status === 0 ? 'Entry' : 'Exit',
        time: log.punch_time,
        location: log.device_sn || 'Main Gate'
      })),
      notices: [
        { id: 1, title: 'Water Supply Maintenance', message: 'Water supply will be interrupted tomorrow between 10 AM and 2 PM due to maintenance work.', date: new Date().toISOString(), type: 'warning' },
        { id: 2, title: 'Rent Reminder', message: 'Please ensure your rent is paid before the 5th to avoid late fees.', date: new Date(Date.now() - 86400000).toISOString(), type: 'info' }
      ]
    });

  } catch (err) {
    console.error('Dashboard Overview error:', err);
    res.status(500).json({ error: 'Internal server error fetching dashboard data.' });
  }
});

module.exports = router;
