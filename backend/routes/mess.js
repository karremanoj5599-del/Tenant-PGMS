const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { db } = require('../db/database');
const router = express.Router();

router.get('/menu', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.tenant.tenant_id;
    // Get the PG owner user_id from the tenant
    const tenant = await db('tenants').where({ tenant_id: tenantId }).first();
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    const userId = tenant.user_id;

    // Fetch the 7-day template menu
    const menuTemplate = await db('mess_menu').where({ user_id: userId }).orderBy('day_index', 'asc');

    // Generate the next 7 days
    const today = new Date();
    const upcomingMenu = [];
    
    // Check opt-outs for the next 7 days for this tenant
    const startDate = today.toISOString().split('T')[0];
    const endDate = new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const optOuts = await db('meal_opt_outs')
      .where({ tenant_id: tenantId })
      .whereBetween('opt_out_date', [startDate, endDate]);
      
    const optOutSet = new Set(optOuts.map(o => o.opt_out_date));

    for (let i = 0; i < 7; i++) {
      const dateObj = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = dateObj.toISOString().split('T')[0];
      const dayIndex = dateObj.getDay(); // 0-6 (Sunday-Saturday)
      
      const dayMenu = menuTemplate.find(m => m.day_index === dayIndex) || {
        day_of_week: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayIndex],
        breakfast: 'Not set', lunch: 'Not set', dinner: 'Not set'
      };

      upcomingMenu.push({
        id: dateStr, // Using date string as ID for the frontend
        day: `${dayMenu.day_of_week}, ${dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        date: dateStr,
        breakfast: dayMenu.breakfast,
        lunch: dayMenu.lunch,
        dinner: dayMenu.dinner,
        optedOut: optOutSet.has(dateStr)
      });
    }

    res.json({ success: true, menu: upcomingMenu });
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/opt-out', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.tenant.tenant_id;
    const { id: dateStr, optedOut } = req.body;

    if (optedOut) {
      // Insert opt out
      await db('meal_opt_outs')
        .insert({ tenant_id: tenantId, opt_out_date: dateStr })
        .onConflict(['tenant_id', 'opt_out_date'])
        .ignore();
    } else {
      // Remove opt out
      await db('meal_opt_outs')
        .where({ tenant_id: tenantId, opt_out_date: dateStr })
        .del();
    }

    res.json({ success: true, message: 'Meal preference updated.' });
  } catch (error) {
    console.error('Error updating opt-out:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/mess/history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.tenant.tenant_id;
    const history = await db('mess_attendance')
      .where({ tenant_id: tenantId })
      .orderBy('scan_time', 'desc')
      .limit(30);

    res.json({ success: true, history });
  } catch (error) {
    console.error('Error fetching mess history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/mess/scan
router.post('/scan', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.tenant.tenant_id;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ status: 'error', message: 'Invalid QR Code. Admin user_id missing.' });
    }

    const tenant = await db('tenants')
      .leftJoin('beds', 'tenants.bed_id', 'beds.bed_id')
      .where('tenants.tenant_id', tenantId)
      .where('tenants.user_id', user_id) // Ensures the tenant belongs to this PG owner
      .first();

    if (!tenant) {
      return res.status(403).json({ status: 'not_found', message: 'You do not belong to this PG.' });
    }

    if (tenant.status !== 'Staying') {
      return res.status(403).json({ status: 'not_found', message: 'Your status is not active.' });
    }

    let settings = await db('mess_settings').where('user_id', user_id).first();
    if (!settings) {
      return res.status(400).json({ status: 'error', message: 'Mess settings not configured by admin.' });
    }

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    let mealType = null;
    if (currentTime >= settings.breakfast_start && currentTime <= settings.breakfast_end) {
      mealType = 'breakfast';
    } else if (currentTime >= settings.lunch_start && currentTime <= settings.lunch_end) {
      mealType = 'lunch';
    } else if (currentTime >= settings.dinner_start && currentTime <= settings.dinner_end) {
      mealType = 'dinner';
    }

    if (!mealType) {
      return res.status(400).json({
        status: 'outside_hours',
        message: 'No meal is being served right now.',
        timings: {
          breakfast: `${settings.breakfast_start} - ${settings.breakfast_end}`,
          lunch: `${settings.lunch_start} - ${settings.lunch_end}`,
          dinner: `${settings.dinner_start} - ${settings.dinner_end}`
        }
      });
    }

    const today = now.toISOString().split('T')[0];
    const existing = await db('mess_attendance')
      .where({ tenant_id: tenantId, meal_type: mealType, scan_date: today })
      .first();

    if (existing) {
      return res.status(409).json({
        status: 'already_scanned',
        message: `You have already been marked for ${mealType} today.`,
        meal_type: mealType
      });
    }

    const rentVal = tenant.custom_rent !== null && tenant.custom_rent !== undefined
      ? tenant.custom_rent
      : (tenant.bed_cost || 0);

    let pendingAmount = 0;
    let rentStatus = 'paid';

    const lastPayment = await db('payments')
      .where('tenant_id', tenantId)
      .orderBy('payment_date', 'desc')
      .first();

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const isExpired = tenant.expiry_date && new Date(tenant.expiry_date) < todayDate;

    if (isExpired) {
      pendingAmount = lastPayment ? (lastPayment.balance || 0) + rentVal : rentVal;
      rentStatus = 'pending';
    } else if (lastPayment && lastPayment.balance > 0) {
      pendingAmount = lastPayment.balance;
      rentStatus = 'pending';
    }

    if (rentStatus === 'pending' && settings.rent_policy === 'block') {
      return res.status(403).json({
        status: 'blocked',
        message: `Cannot mark attendance — ₹${pendingAmount} rent is pending. Please pay first.`,
        meal_type: mealType,
        pending_amount: pendingAmount
      });
    }

    await db('mess_attendance').insert({
      tenant_id: tenantId,
      user_id: parseInt(user_id),
      meal_type: mealType,
      scan_date: today,
      scan_time: now.toISOString(),
      rent_status: rentStatus,
      pending_amount: pendingAmount
    });

    const result = {
      status: rentStatus === 'pending' ? 'warning' : 'success',
      message: rentStatus === 'pending'
        ? `Marked for ${mealType}, but ₹${pendingAmount} rent is pending.`
        : `Marked for ${mealType}! Enjoy your meal!`,
      meal_type: mealType,
      rent_status: rentStatus,
      pending_amount: pendingAmount
    };

    res.json(result);
  } catch (error) {
    console.error('[Mess Scan] Error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
});

module.exports = router;
