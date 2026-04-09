/**
 * Auth Routes - Tenant Login & Profile PIN
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, dbType } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'pgms_secret_key_2026';

/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { mobile, password } = req.body;

    if (!mobile || !password) {
      return res.status(400).json({ error: 'Mobile number and password (PIN) are required.' });
    }

    // 1. Find the tenant with join for profile data
    let tenant;
    if (dbType === 'supabase') {
      tenant = await db('tenants')
        .leftJoin('beds', 'tenants.bed_id', 'beds.bed_id')
        .leftJoin('rooms', 'beds.room_id', 'rooms.room_id')
        .where('tenants.mobile', mobile)
        .select('tenants.*', 'beds.bed_number', 'rooms.room_number')
        .first();
    } else {
      tenant = db.prepare(`
        SELECT t.*, b.bed_number, r.room_number 
        FROM tenants t
        LEFT JOIN beds b ON t.bed_id = b.bed_id
        LEFT JOIN rooms r ON b.room_id = r.room_id
        WHERE t.mobile = ?
      `).get(mobile);
    }

    if (!tenant) {
      return res.status(401).json({ error: 'Invalid mobile number or PIN.' });
    }

    // NEW: Check if mobile access is enabled (password_hash must exist)
    if (!tenant.password_hash) {
      return res.status(403).json({ error: 'Mobile access not enabled. Please contact your admin.' });
    }

    // 2. Verify Password/PIN
    const isValid = await bcrypt.compare(password, tenant.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid mobile number or PIN.' });
    }

    // 3. Return JSON with required profile data
    res.json({
      success: true,
      token: tenant.tenant_id.toString(), // Used as x-tenant-id in mobile app
      tenant: {
        id: tenant.tenant_id,
        user_id: tenant.user_id, // ADMIN identification
        name: tenant.name,
        mobile: tenant.mobile,
        room: tenant.room_number || 'N/A',
        bed: tenant.bed_number || 'N/A',
        access_status: tenant.access_status || 'active'
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

/**
 * POST /api/auth/update-pin
 */
router.post('/update-pin', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.tenant.tenant_id;
    const { newPin } = req.body;

    if (!newPin || newPin.length < 4) {
      return res.status(400).json({ error: 'New PIN must be at least 4 digits.' });
    }

    const hashedPassword = await bcrypt.hash(newPin, 10);

    if (dbType === 'supabase') {
      await db('tenants').where('tenant_id', tenantId).update({
        password_hash: hashedPassword,
        biometric_pin: newPin // Sync biometric PIN to the main field
      });
    } else {
      db.prepare('UPDATE tenants SET password_hash = ?, biometric_pin = ? WHERE tenant_id = ?')
        .run(hashedPassword, newPin, tenantId);
    }

    res.json({ success: true, message: 'PIN updated successfully.' });
  } catch (err) {
    console.error('PIN update error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
